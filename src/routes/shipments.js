const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getNextStatus } = require('../utils/helpers');

const router = express.Router();

function formatShipment(s) {
  const customer = db.prepare('SELECT first_name, last_name, email, phone FROM users WHERE id = ?').get(s.customer_id);
  const driver = s.driver_id
    ? db.prepare('SELECT first_name, last_name, phone FROM users WHERE id = ?').get(s.driver_id)
    : null;
  return {
    id: s.id,
    trackingNumber: s.tracking_number,
    customerId: s.customer_id,
    customer: customer ? { name: `${customer.first_name} ${customer.last_name}`, email: customer.email, phone: customer.phone } : null,
    driverId: s.driver_id,
    driver: driver ? { name: `${driver.first_name} ${driver.last_name}`, phone: driver.phone } : null,
    warehouseId: s.warehouse_id,
    status: s.status,
    serviceType: s.service_type,
    pickup: { street: s.pickup_street, city: s.pickup_city, state: s.pickup_state, postal: s.pickup_postal, country: s.pickup_country },
    delivery: { street: s.delivery_street, city: s.delivery_city, state: s.delivery_state, postal: s.delivery_postal, country: s.delivery_country },
    weightKg: s.weight_kg,
    dimensions: { length: s.length_cm, width: s.width_cm, height: s.height_cm },
    description: s.description,
    price: s.price,
    currency: s.currency,
    estimatedDelivery: s.estimated_delivery,
    actualDelivery: s.actual_delivery,
    proofOfDeliveryUrl: s.proof_of_delivery_url,
    notes: s.notes,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

function getEvents(shipmentId) {
  return db.prepare('SELECT * FROM shipment_events WHERE shipment_id = ? ORDER BY created_at ASC').all(shipmentId)
    .map(e => ({
      id: e.id,
      status: e.status,
      location: e.location,
      description: e.description,
      createdAt: e.created_at,
    }));
}

// Public tracking
router.get('/track/:trackingNumber', (req, res) => {
  const s = db.prepare('SELECT * FROM shipments WHERE tracking_number = ?').get(req.params.trackingNumber.toUpperCase());
  if (!s) return res.status(404).json({ error: 'Shipment not found' });
  res.json({ shipment: formatShipment(s), events: getEvents(s.id) });
});

router.get('/', authenticate, (req, res) => {
  let shipments;
  if (req.user.role === 'admin') {
    shipments = db.prepare('SELECT * FROM shipments ORDER BY created_at DESC').all();
  } else if (req.user.role === 'driver') {
    shipments = db.prepare('SELECT * FROM shipments WHERE driver_id = ? ORDER BY created_at DESC').all(req.user.id);
  } else {
    shipments = db.prepare('SELECT * FROM shipments WHERE customer_id = ? ORDER BY created_at DESC').all(req.user.id);
  }
  res.json({ shipments: shipments.map(formatShipment) });
});

router.get('/:id', authenticate, (req, res) => {
  const s = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Shipment not found' });
  if (req.user.role === 'customer' && s.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  if (req.user.role === 'driver' && s.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json({ shipment: formatShipment(s), events: getEvents(s.id) });
});

router.patch('/:id/status', authenticate, authorize('driver', 'admin'), (req, res) => {
  const { status, location, description } = req.body;
  const s = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Shipment not found' });
  if (req.user.role === 'driver' && s.driver_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your delivery' });
  }
  const newStatus = status || getNextStatus(s.status);
  db.prepare('UPDATE shipments SET status = ?, updated_at = datetime(\'now\'), actual_delivery = CASE WHEN ? = \'delivered\' THEN datetime(\'now\') ELSE actual_delivery END WHERE id = ?')
    .run(newStatus, newStatus, s.id);
  db.prepare('INSERT INTO shipment_events (id, shipment_id, status, location, description) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), s.id, newStatus, location || s.delivery_city,
    description || `Status updated to ${newStatus.replace(/_/g, ' ')}`
  );
  if (newStatus === 'delivered') {
    db.prepare('INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), s.customer_id, 'Package Delivered',
      `Your shipment ${s.tracking_number} has been delivered.`, 'success'
    );
  }
  const updated = db.prepare('SELECT * FROM shipments WHERE id = ?').get(s.id);
  res.json({ shipment: formatShipment(updated), events: getEvents(s.id) });
});

router.post('/:id/proof', authenticate, authorize('driver'), upload.single('proof'), (req, res) => {
  const s = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
  if (!s || s.driver_id !== req.user.id) return res.status(404).json({ error: 'Shipment not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE shipments SET proof_of_delivery_url = ?, status = \'delivered\', actual_delivery = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?')
    .run(url, s.id);
  db.prepare('INSERT INTO shipment_events (id, shipment_id, status, location, description) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), s.id, 'delivered', s.delivery_city, 'Proof of delivery uploaded'
  );
  res.json({ proofUrl: url, message: 'Proof uploaded and delivery marked complete' });
});

router.patch('/:id/assign', authenticate, authorize('admin'), (req, res) => {
  const { driverId } = req.body;
  const s = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Shipment not found' });
  db.prepare('UPDATE shipments SET driver_id = ?, updated_at = datetime(\'now\') WHERE id = ?').run(driverId, s.id);
  if (driverId) {
    db.prepare('INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), driverId, 'New Delivery Assigned',
      `You have been assigned shipment ${s.tracking_number}.`, 'info'
    );
  }
  const updated = db.prepare('SELECT * FROM shipments WHERE id = ?').get(s.id);
  res.json({ shipment: formatShipment(updated) });
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const s = db.prepare('SELECT id FROM shipments WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Shipment not found' });
  db.prepare('DELETE FROM shipments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Shipment deleted' });
});

module.exports = router;
