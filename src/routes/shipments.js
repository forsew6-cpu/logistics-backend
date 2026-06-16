const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getNextStatus } = require('../utils/helpers');
const { formatShipment } = require('../utils/formatters');
const { createNotification } = require('../utils/notifications');
const { createShipmentEvent } = require('../utils/events');

const router = express.Router();

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
  createShipmentEvent({
    shipmentId: s.id,
    status: newStatus,
    location: location || s.delivery_city,
    description: description || `Status updated to ${newStatus.replace(/_/g, ' ')}`,
  });
  if (newStatus === 'delivered') {
    createNotification({
      userId: s.customer_id,
      title: 'Package Delivered',
      message: `Your shipment ${s.tracking_number} has been delivered.`,
      type: 'success',
    });
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
  createShipmentEvent({
    shipmentId: s.id,
    status: 'delivered',
    location: s.delivery_city,
    description: 'Proof of delivery uploaded',
  });
  res.json({ proofUrl: url, message: 'Proof uploaded and delivery marked complete' });
});

router.patch('/:id/assign', authenticate, authorize('admin'), (req, res) => {
  const { driverId } = req.body;
  const s = db.prepare('SELECT * FROM shipments WHERE id = ?').get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Shipment not found' });
  db.prepare('UPDATE shipments SET driver_id = ?, updated_at = datetime(\'now\') WHERE id = ?').run(driverId, s.id);
  if (driverId) {
    createNotification({
      userId: driverId,
      title: 'New Delivery Assigned',
      message: `You have been assigned shipment ${s.tracking_number}.`,
      type: 'info',
    });
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
