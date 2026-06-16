const db = require('../db');

function formatUser(u) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    phone: u.phone,
    role: u.role,
    isActive: u.is_active !== undefined ? !!u.is_active : undefined,
    avatarUrl: u.avatar_url,
    createdAt: u.created_at,
  };
}

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

function formatAddress(a) {
  return {
    id: a.id,
    label: a.label,
    street: a.street,
    city: a.city,
    state: a.state,
    postalCode: a.postal_code,
    country: a.country,
    isDefault: !!a.is_default,
  };
}

module.exports = { formatUser, formatShipment, formatAddress };
