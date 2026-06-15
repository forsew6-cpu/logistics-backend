const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), (_req, res) => {
  const users = db.prepare(`
    SELECT id, email, first_name, last_name, phone, role, is_active, created_at
    FROM users ORDER BY created_at DESC
  `).all();
  res.json({ users: users.map(formatUser) });
});

router.get('/drivers', authenticate, authorize('admin'), (_req, res) => {
  const drivers = db.prepare(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at,
      (SELECT COUNT(*) FROM shipments WHERE driver_id = u.id AND status NOT IN ('delivered','cancelled')) as active_deliveries
    FROM users u WHERE u.role = 'driver' ORDER BY u.first_name
  `).all();
  res.json({ drivers: drivers.map(d => ({
    ...formatUser(d),
    activeDeliveries: d.active_deliveries,
  })) });
});

router.get('/customers', authenticate, authorize('admin'), (_req, res) => {
  const customers = db.prepare(`
    SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at,
      (SELECT COUNT(*) FROM shipments WHERE customer_id = u.id) as total_shipments
    FROM users u WHERE u.role = 'customer' ORDER BY u.created_at DESC
  `).all();
  res.json({ customers: customers.map(c => ({
    ...formatUser(c),
    totalShipments: c.total_shipments,
  })) });
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { email, password, firstName, lastName, phone, role } = req.body;
  const bcrypt = require('bcryptjs');
  const id = uuidv4();
  const hash = bcrypt.hashSync(password || 'changeme123', 10);
  db.prepare('INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, email, hash, firstName, lastName, phone, role);
  const user = db.prepare('SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = ?').get(id);
  res.status(201).json({ user: formatUser(user) });
});

router.patch('/:id', authenticate, authorize('admin'), (req, res) => {
  const { isActive, firstName, lastName, phone } = req.body;
  db.prepare(`
    UPDATE users SET
      is_active = COALESCE(?, is_active),
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      phone = COALESCE(?, phone),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(isActive !== undefined ? (isActive ? 1 : 0) : null, firstName, lastName, phone, req.params.id);
  const user = db.prepare('SELECT id, email, first_name, last_name, phone, role, is_active, created_at FROM users WHERE id = ?').get(req.params.id);
  res.json({ user: formatUser(user) });
});

// Addresses
router.get('/addresses', authenticate, (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(req.user.id);
  res.json({ addresses: addresses.map(formatAddress) });
});

router.post('/addresses', authenticate, (req, res) => {
  const { label, street, city, state, postalCode, country, isDefault } = req.body;
  const id = uuidv4();
  if (isDefault) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }
  db.prepare('INSERT INTO addresses (id, user_id, label, street, city, state, postal_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.user.id, label, street, city, state, postalCode, country || 'US', isDefault ? 1 : 0);
  const addr = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
  res.status(201).json({ address: formatAddress(addr) });
});

router.delete('/addresses/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Address deleted' });
});

// Invoices
router.get('/invoices', authenticate, (req, res) => {
  let invoices;
  if (req.user.role === 'admin') {
    invoices = db.prepare(`
      SELECT i.*, s.tracking_number, u.first_name, u.last_name
      FROM invoices i JOIN shipments s ON i.shipment_id = s.id
      JOIN users u ON s.customer_id = u.id ORDER BY i.created_at DESC
    `).all();
  } else {
    invoices = db.prepare(`
      SELECT i.*, s.tracking_number FROM invoices i
      JOIN shipments s ON i.shipment_id = s.id
      WHERE s.customer_id = ? ORDER BY i.created_at DESC
    `).all(req.user.id);
  }
  res.json({ invoices: invoices.map(i => ({
    id: i.id,
    invoiceNumber: i.invoice_number,
    shipmentId: i.shipment_id,
    trackingNumber: i.tracking_number,
    amount: i.amount,
    currency: i.currency,
    status: i.status,
    dueDate: i.due_date,
    paidAt: i.paid_at,
    createdAt: i.created_at,
    customerName: i.first_name ? `${i.first_name} ${i.last_name}` : undefined,
  })) });
});

// Notifications
router.get('/notifications', authenticate, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json({ notifications: notifications.map(n => ({
    id: n.id, title: n.title, message: n.message, type: n.type,
    isRead: !!n.is_read, link: n.link, createdAt: n.created_at,
  })) });
});

router.patch('/notifications/read', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

function formatUser(u) {
  return {
    id: u.id, email: u.email, firstName: u.first_name, lastName: u.last_name,
    phone: u.phone, role: u.role, isActive: !!u.is_active, createdAt: u.created_at,
  };
}

function formatAddress(a) {
  return {
    id: a.id, label: a.label, street: a.street, city: a.city, state: a.state,
    postalCode: a.postal_code, country: a.country, isDefault: !!a.is_default,
  };
}

module.exports = router;
