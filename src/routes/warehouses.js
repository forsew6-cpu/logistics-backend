const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function formatWarehouse(w) {
  return {
    id: w.id, name: w.name, code: w.code,
    address: { street: w.street, city: w.city, state: w.state, postal: w.postal_code, country: w.country },
    capacity: w.capacity, occupied: w.occupied,
    occupancyRate: Math.round((w.occupied / w.capacity) * 100),
    managerId: w.manager_id, isActive: !!w.is_active, createdAt: w.created_at,
  };
}

router.get('/', authenticate, (_req, res) => {
  const warehouses = db.prepare('SELECT * FROM warehouses WHERE is_active = 1').all();
  res.json({ warehouses: warehouses.map(formatWarehouse) });
});

router.get('/:id', authenticate, (req, res) => {
  const w = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(req.params.id);
  if (!w) return res.status(404).json({ error: 'Warehouse not found' });
  const inventory = db.prepare('SELECT * FROM inventory WHERE warehouse_id = ?').all(w.id);
  res.json({
    warehouse: formatWarehouse(w),
    inventory: inventory.map(i => ({
      id: i.id, sku: i.sku, name: i.name, description: i.description,
      quantity: i.quantity, unit: i.unit, locationCode: i.location_code, minStock: i.min_stock,
    })),
  });
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  const { name, code, street, city, state, postalCode, country, capacity } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO warehouses (id, name, code, street, city, state, postal_code, country, capacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, code, street, city, state, postalCode, country || 'US', capacity || 10000);
  const w = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(id);
  res.status(201).json({ warehouse: formatWarehouse(w) });
});

router.patch('/:id', authenticate, authorize('admin'), (req, res) => {
  const { occupied, capacity, isActive } = req.body;
  db.prepare('UPDATE warehouses SET occupied = COALESCE(?, occupied), capacity = COALESCE(?, capacity), is_active = COALESCE(?, is_active) WHERE id = ?')
    .run(occupied, capacity, isActive !== undefined ? (isActive ? 1 : 0) : null, req.params.id);
  const w = db.prepare('SELECT * FROM warehouses WHERE id = ?').get(req.params.id);
  res.json({ warehouse: formatWarehouse(w) });
});

// Inventory
router.post('/:id/inventory', authenticate, authorize('admin'), (req, res) => {
  const { sku, name, description, quantity, unit, locationCode, minStock } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO inventory (id, warehouse_id, sku, name, description, quantity, unit, location_code, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.params.id, sku, name, description, quantity || 0, unit || 'units', locationCode, minStock || 10);
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
  res.status(201).json({ item: { id: item.id, sku: item.sku, name: item.name, quantity: item.quantity } });
});

router.patch('/inventory/:itemId', authenticate, authorize('admin'), (req, res) => {
  const { quantity, name, minStock } = req.body;
  db.prepare('UPDATE inventory SET quantity = COALESCE(?, quantity), name = COALESCE(?, name), min_stock = COALESCE(?, min_stock), updated_at = datetime(\'now\') WHERE id = ?')
    .run(quantity, name, minStock, req.params.itemId);
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.itemId);
  res.json({ item });
});

// Storage requests
router.get('/storage/requests', authenticate, (req, res) => {
  let requests;
  if (req.user.role === 'admin') {
    requests = db.prepare(`
      SELECT sr.*, w.name as warehouse_name, u.first_name, u.last_name
      FROM storage_requests sr
      JOIN warehouses w ON sr.warehouse_id = w.id
      JOIN users u ON sr.customer_id = u.id ORDER BY sr.created_at DESC
    `).all();
  } else {
    requests = db.prepare(`
      SELECT sr.*, w.name as warehouse_name FROM storage_requests sr
      JOIN warehouses w ON sr.warehouse_id = w.id
      WHERE sr.customer_id = ? ORDER BY sr.created_at DESC
    `).all(req.user.id);
  }
  res.json({ requests: requests.map(r => ({
    id: r.id, productName: r.product_name, quantity: r.quantity,
    durationDays: r.duration_days, status: r.status, notes: r.notes,
    warehouseName: r.warehouse_name, customerName: r.first_name ? `${r.first_name} ${r.last_name}` : undefined,
    createdAt: r.created_at,
  })) });
});

router.post('/storage/requests', authenticate, (req, res) => {
  const { warehouseId, productName, quantity, durationDays, notes } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO storage_requests (id, customer_id, warehouse_id, product_name, quantity, duration_days, notes) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, req.user.id, warehouseId, productName, quantity, durationDays, notes);
  res.status(201).json({ message: 'Storage request submitted', id });
});

router.patch('/storage/requests/:id', authenticate, authorize('admin'), (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE storage_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Request updated' });
});

module.exports = router;
