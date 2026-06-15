const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { generateTrackingNumber, generateInvoiceNumber } = require('./utils/helpers');

console.log('Seeding database...');

const hash = bcrypt.hashSync('password123', 10);

const users = [
  { id: uuidv4(), email: 'admin@nexalogistics.com', first: 'Sarah', last: 'Mitchell', role: 'admin', phone: '+1 (555) 100-0001' },
  { id: uuidv4(), email: 'customer@example.com', first: 'James', last: 'Wilson', role: 'customer', phone: '+1 (555) 200-0001' },
  { id: uuidv4(), email: 'customer2@example.com', first: 'Emily', last: 'Chen', role: 'customer', phone: '+1 (555) 200-0002' },
  { id: uuidv4(), email: 'driver@example.com', first: 'Marcus', last: 'Johnson', role: 'driver', phone: '+1 (555) 300-0001' },
  { id: uuidv4(), email: 'driver2@example.com', first: 'Lisa', last: 'Rodriguez', role: 'driver', phone: '+1 (555) 300-0002' },
];

const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, email, password_hash, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)');
users.forEach(u => insertUser.run(u.id, u.email, hash, u.first, u.last, u.phone, u.role));

const admin = users[0];
const customer = users[1];
const customer2 = users[2];
const driver = users[3];
const driver2 = users[4];

// Addresses
const addresses = [
  { id: uuidv4(), userId: customer.id, label: 'Home', street: '742 Evergreen Terrace', city: 'Springfield', state: 'IL', postal: '62701', country: 'US', def: 1 },
  { id: uuidv4(), userId: customer.id, label: 'Office', street: '100 Commerce Blvd', city: 'Chicago', state: 'IL', postal: '60601', country: 'US', def: 0 },
];
const insertAddr = db.prepare('INSERT OR IGNORE INTO addresses (id, user_id, label, street, city, state, postal_code, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
addresses.forEach(a => insertAddr.run(a.id, a.userId, a.label, a.street, a.city, a.state, a.postal, a.country, a.def));

// Warehouses
const warehouses = [
  { id: uuidv4(), name: 'Chicago Central Hub', code: 'CHI-01', street: '2500 Logistics Way', city: 'Chicago', state: 'IL', postal: '60607', capacity: 50000, occupied: 32500 },
  { id: uuidv4(), name: 'Los Angeles Distribution', code: 'LAX-01', street: '8900 Harbor Blvd', city: 'Los Angeles', state: 'CA', postal: '90021', capacity: 40000, occupied: 28000 },
  { id: uuidv4(), name: 'New York Metro Center', code: 'NYC-01', street: '1500 Industrial Pkwy', city: 'Newark', state: 'NJ', postal: '07114', capacity: 35000, occupied: 21000 },
];
const insertWh = db.prepare('INSERT OR IGNORE INTO warehouses (id, name, code, street, city, state, postal_code, country, capacity, occupied) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
warehouses.forEach(w => insertWh.run(w.id, w.name, w.code, w.street, w.city, w.state, w.postal, 'US', w.capacity, w.occupied));

// Inventory
const inventory = [
  { wh: warehouses[0].id, sku: 'ELEC-001', name: 'Consumer Electronics', qty: 1250, loc: 'A-12-03' },
  { wh: warehouses[0].id, sku: 'FURN-002', name: 'Office Furniture', qty: 340, loc: 'B-05-01' },
  { wh: warehouses[0].id, sku: 'PHRM-003', name: 'Pharmaceutical Supplies', qty: 890, loc: 'C-01-07' },
  { wh: warehouses[1].id, sku: 'AUTO-004', name: 'Auto Parts', qty: 2100, loc: 'D-08-02' },
  { wh: warehouses[1].id, sku: 'TEXT-005', name: 'Textile Goods', qty: 5600, loc: 'E-03-04' },
];
const insertInv = db.prepare('INSERT OR IGNORE INTO inventory (id, warehouse_id, sku, name, quantity, location_code) VALUES (?, ?, ?, ?, ?, ?)');
inventory.forEach(i => insertInv.run(uuidv4(), i.wh, i.sku, i.name, i.qty, i.loc));

// Shipments with various statuses
const shipmentData = [
  { status: 'delivered', service: 'express', driver: driver.id, customer: customer.id, wh: warehouses[0].id, days: -5 },
  { status: 'in_transit', service: 'international', driver: driver2.id, customer: customer.id, wh: warehouses[1].id, days: -2 },
  { status: 'out_for_delivery', service: 'local', driver: driver.id, customer: customer2.id, wh: warehouses[0].id, days: -1 },
  { status: 'confirmed', service: 'freight', driver: null, customer: customer2.id, wh: warehouses[2].id, days: 0 },
  { status: 'picked_up', service: 'express', driver: driver2.id, customer: customer.id, wh: warehouses[1].id, days: -1 },
];

const insertShip = db.prepare(`
  INSERT OR IGNORE INTO shipments (
    id, tracking_number, customer_id, driver_id, warehouse_id, status, service_type,
    pickup_street, pickup_city, pickup_state, pickup_postal, pickup_country,
    delivery_street, delivery_city, delivery_state, delivery_postal, delivery_country,
    weight_kg, length_cm, width_cm, height_cm, description, price, estimated_delivery
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const trackingNumbers = [];
shipmentData.forEach((s, i) => {
  const id = uuidv4();
  const tn = generateTrackingNumber();
  trackingNumbers.push(tn);
  const est = new Date();
  est.setDate(est.getDate() + (s.status === 'delivered' ? -1 : 3));
  const price = [24.99, 89.99, 12.50, 149.99, 34.99][i];
  insertShip.run(
    id, tn, s.customer, s.driver, s.wh, s.status, s.service,
    '2500 Logistics Way', 'Chicago', 'IL', '60607', 'US',
    ['123 Main St', '456 Oak Ave', '789 Pine Rd', '321 Elm St', '654 Maple Dr'][i],
    ['New York', 'Los Angeles', 'Miami', 'Seattle', 'Boston'][i],
    ['NY', 'CA', 'FL', 'WA', 'MA'][i],
    ['10001', '90001', '33101', '98101', '02101'][i], 'US',
    [2.5, 15.0, 1.2, 45.0, 5.0][i], 30, 20, 15,
    ['Electronics package', 'Industrial equipment', 'Documents', 'Pallet shipment', 'Medical supplies'][i],
    price, est.toISOString().split('T')[0]
  );

  const events = [
    { status: 'confirmed', loc: 'Chicago', desc: 'Shipment booked and confirmed' },
    { status: 'picked_up', loc: 'Chicago', desc: 'Package picked up from sender' },
    { status: 'in_transit', loc: 'Distribution Hub', desc: 'Package in transit' },
    { status: 'out_for_delivery', loc: 'Local Facility', desc: 'Out for delivery' },
    { status: 'delivered', loc: 'Destination', desc: 'Package delivered successfully' },
  ];
  const statusIdx = ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'].indexOf(s.status);
  const insertEvent = db.prepare('INSERT INTO shipment_events (id, shipment_id, status, location, description, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  for (let e = 0; e <= statusIdx; e++) {
    const d = new Date();
    d.setDate(d.getDate() - (statusIdx - e));
    insertEvent.run(uuidv4(), id, events[e].status, events[e].loc, events[e].desc, d.toISOString());
  }

  const invId = uuidv4();
  const invNum = generateInvoiceNumber();
  db.prepare('INSERT INTO invoices (id, shipment_id, invoice_number, amount, status, due_date) VALUES (?, ?, ?, ?, ?, ?)').run(
    invId, id, invNum, price, s.status === 'delivered' ? 'paid' : 'pending',
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  if (s.status === 'delivered') {
    db.prepare('INSERT INTO payments (id, invoice_id, customer_id, amount, method, status) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuidv4(), invId, s.customer, price, 'card', 'completed'
    );
  }
});

// Storage requests
db.prepare('INSERT INTO storage_requests (id, customer_id, warehouse_id, product_name, quantity, duration_days, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
  uuidv4(), customer.id, warehouses[0].id, 'Seasonal Inventory', 500, 90, 'active'
);
db.prepare('INSERT INTO storage_requests (id, customer_id, warehouse_id, product_name, quantity, duration_days, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
  uuidv4(), customer2.id, warehouses[1].id, 'Retail Stock', 1200, 60, 'pending'
);

// Notifications
const notifs = [
  { userId: customer.id, title: 'Shipment Delivered', message: `Your package has been delivered successfully.`, type: 'success' },
  { userId: customer.id, title: 'Invoice Ready', message: 'A new invoice is available for download.', type: 'info' },
  { userId: driver.id, title: 'New Delivery Assigned', message: 'You have 3 active deliveries today.', type: 'info' },
];
const insertNotif = db.prepare('INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)');
notifs.forEach(n => insertNotif.run(uuidv4(), n.userId, n.title, n.message, n.type));

console.log('Seed complete!');
console.log('\nDemo accounts (password: password123):');
console.log('  Admin:    admin@nexalogistics.com');
console.log('  Customer: customer@example.com');
console.log('  Driver:   driver@example.com');
console.log('\nSample tracking numbers:');
trackingNumbers.forEach(tn => console.log(`  ${tn}`));
