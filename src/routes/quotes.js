const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { calculateQuote } = require('../utils/helpers');

const router = express.Router();

router.post('/calculate', (req, res) => {
  const { serviceType, weightKg, lengthCm, widthCm, heightCm } = req.body;
  if (!serviceType || !weightKg) {
    return res.status(400).json({ error: 'Service type and weight are required' });
  }
  const quote = calculateQuote({ serviceType, weightKg, lengthCm, widthCm, heightCm });
  res.json({ quote });
});

router.get('/rates', (_req, res) => {
  res.json({
    rates: [
      { id: 'local', name: 'Local Delivery', description: 'Same-city delivery within 1-2 days', basePrice: 9.99 },
      { id: 'express', name: 'Express Delivery', description: 'Next-day priority delivery', basePrice: 19.99 },
      { id: 'international', name: 'International Shipping', description: 'Worldwide shipping in 5-10 days', basePrice: 49.99 },
      { id: 'freight', name: 'Freight Services', description: 'Heavy cargo and pallet shipping', basePrice: 99.99 },
      { id: 'warehousing', name: 'Warehousing & Storage', description: 'Secure storage solutions', basePrice: 29.99 },
    ],
  });
});

router.post('/book', authenticate, (req, res) => {
  const {
    serviceType, pickupStreet, pickupCity, pickupState, pickupPostal, pickupCountry,
    deliveryStreet, deliveryCity, deliveryState, deliveryPostal, deliveryCountry,
    weightKg, lengthCm, widthCm, heightCm, description, pickupDate, notes,
  } = req.body;

  if (!serviceType || !pickupStreet || !pickupCity || !pickupPostal ||
      !deliveryStreet || !deliveryCity || !deliveryPostal || !weightKg) {
    return res.status(400).json({ error: 'Missing required booking fields' });
  }

  const quote = calculateQuote({ serviceType, weightKg, lengthCm, widthCm, heightCm });
  const { generateTrackingNumber, generateInvoiceNumber } = require('../utils/helpers');
  const trackingNumber = generateTrackingNumber();
  const shipmentId = uuidv4();
  const invoiceId = uuidv4();
  const invoiceNumber = generateInvoiceNumber();

  const insertShipment = db.prepare(`
    INSERT INTO shipments (
      id, tracking_number, customer_id, status, service_type,
      pickup_street, pickup_city, pickup_state, pickup_postal, pickup_country,
      delivery_street, delivery_city, delivery_state, delivery_postal, delivery_country,
      weight_kg, length_cm, width_cm, height_cm, description, price, estimated_delivery, notes
    ) VALUES (?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertShipment.run(
    shipmentId, trackingNumber, req.user.id, serviceType,
    pickupStreet, pickupCity, pickupState || null, pickupPostal, pickupCountry || 'US',
    deliveryStreet, deliveryCity, deliveryState || null, deliveryPostal, deliveryCountry || 'US',
    weightKg, lengthCm || null, widthCm || null, heightCm || null,
    description || null, quote.price, quote.estimatedDelivery, notes || null
  );

  db.prepare('INSERT INTO shipment_events (id, shipment_id, status, location, description) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), shipmentId, 'confirmed', pickupCity, 'Shipment booked and confirmed'
  );

  db.prepare('INSERT INTO invoices (id, shipment_id, invoice_number, amount, due_date) VALUES (?, ?, ?, ?, ?)').run(
    invoiceId, shipmentId, invoiceNumber, quote.price,
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  db.prepare('INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuidv4(), req.user.id, 'Booking Confirmed',
    `Your shipment ${trackingNumber} has been confirmed.`, 'success',
    `/dashboard/customer.html#shipments`
  );

  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(shipmentId);
  res.status(201).json({
    message: 'Booking confirmed',
    shipment: formatShipment(shipment),
    invoice: { id: invoiceId, invoiceNumber, amount: quote.price },
  });
});

function formatShipment(s) {
  return {
    id: s.id,
    trackingNumber: s.tracking_number,
    customerId: s.customer_id,
    driverId: s.driver_id,
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

module.exports = router;
