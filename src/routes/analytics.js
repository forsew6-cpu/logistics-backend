const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authenticate, authorize('admin'), (_req, res) => {
  const totalShipments = db.prepare('SELECT COUNT(*) as c FROM shipments').get().c;
  const activeShipments = db.prepare("SELECT COUNT(*) as c FROM shipments WHERE status NOT IN ('delivered','cancelled')").get().c;
  const deliveredToday = db.prepare("SELECT COUNT(*) as c FROM shipments WHERE status = 'delivered' AND date(actual_delivery) = date('now')").get().c;
  const totalCustomers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c;
  const totalDrivers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'driver' AND is_active = 1").get().c;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM invoices WHERE status = 'paid'").get().t;
  const pendingRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) as t FROM invoices WHERE status = 'pending'").get().t;

  res.json({
    overview: {
      totalShipments, activeShipments, deliveredToday,
      totalCustomers, totalDrivers,
      totalRevenue, pendingRevenue,
    },
  });
});

router.get('/revenue', authenticate, authorize('admin'), (_req, res) => {
  const data = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as revenue, COUNT(*) as count
    FROM invoices WHERE status IN ('paid','pending')
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all();
  res.json({ revenue: data.reverse().map(d => ({ month: d.month, revenue: d.revenue, count: d.count })) });
});

router.get('/delivery-performance', authenticate, authorize('admin'), (_req, res) => {
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM shipments GROUP BY status').all();
  const onTime = db.prepare(`
    SELECT COUNT(*) as c FROM shipments
    WHERE status = 'delivered' AND date(actual_delivery) <= date(estimated_delivery)
  `).get().c;
  const total = db.prepare("SELECT COUNT(*) as c FROM shipments WHERE status = 'delivered'").get().c;
  res.json({
    byStatus: byStatus.map(s => ({ status: s.status, count: s.count })),
    onTimeRate: total > 0 ? Math.round((onTime / total) * 100) : 0,
    onTime, total,
  });
});

router.get('/customer-growth', authenticate, authorize('admin'), (_req, res) => {
  const data = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM users WHERE role = 'customer' GROUP BY month ORDER BY month DESC LIMIT 12
  `).all();
  res.json({ growth: data.reverse().map(d => ({ month: d.month, count: d.count })) });
});

router.get('/driver-performance', authenticate, authorize('admin'), (_req, res) => {
  const drivers = db.prepare(`
    SELECT u.id, u.first_name, u.last_name,
      COUNT(s.id) as total_deliveries,
      SUM(CASE WHEN s.status = 'delivered' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN s.status NOT IN ('delivered','cancelled') THEN 1 ELSE 0 END) as active
    FROM users u LEFT JOIN shipments s ON s.driver_id = u.id
    WHERE u.role = 'driver' GROUP BY u.id
  `).all();
  res.json({
    drivers: drivers.map(d => ({
      id: d.id, name: `${d.first_name} ${d.last_name}`,
      totalDeliveries: d.total_deliveries,
      completed: d.completed,
      active: d.active,
      completionRate: d.total_deliveries > 0 ? Math.round((d.completed / d.total_deliveries) * 100) : 0,
    })),
  });
});

router.get('/shipment-stats', authenticate, authorize('admin'), (_req, res) => {
  const byService = db.prepare('SELECT service_type, COUNT(*) as count, SUM(price) as revenue FROM shipments GROUP BY service_type').all();
  const recent = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count FROM shipments
    WHERE created_at >= date('now', '-30 days') GROUP BY day ORDER BY day
  `).all();
  res.json({
    byService: byService.map(s => ({ service: s.service_type, count: s.count, revenue: s.revenue })),
    daily: recent.map(r => ({ day: r.day, count: r.count })),
  });
});

// Payments
router.get('/payments', authenticate, authorize('admin'), (_req, res) => {
  const payments = db.prepare(`
    SELECT p.*, i.invoice_number, u.first_name, u.last_name
    FROM payments p JOIN invoices i ON p.invoice_id = i.id
    JOIN users u ON p.customer_id = u.id ORDER BY p.created_at DESC
  `).all();
  res.json({ payments: payments.map(p => ({
    id: p.id, invoiceNumber: p.invoice_number, amount: p.amount,
    method: p.method, status: p.status, customerName: `${p.first_name} ${p.last_name}`,
    createdAt: p.created_at,
  })) });
});

router.post('/payments', authenticate, authorize('admin'), (req, res) => {
  const { invoiceId, customerId, amount, method, transactionRef } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO payments (id, invoice_id, customer_id, amount, method, transaction_ref) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, invoiceId, customerId, amount, method, transactionRef);
  db.prepare("UPDATE invoices SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(invoiceId);
  res.status(201).json({ message: 'Payment recorded' });
});

// Send notification
router.post('/notifications', authenticate, authorize('admin'), (req, res) => {
  const { userId, title, message, type } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)')
    .run(id, userId, title, message, type || 'info');
  res.status(201).json({ message: 'Notification sent' });
});

// Public stats for homepage
router.get('/public-stats', (_req, res) => {
  res.json({
    stats: {
      deliveriesCompleted: 2847593,
      customersServed: 156420,
      countriesCovered: 195,
      onTimeRate: 99.2,
    },
  });
});

module.exports = router;
