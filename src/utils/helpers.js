function generateTrackingNumber() {
  const prefix = 'NXL';
  const num = Math.floor(1000000000 + Math.random() * 9000000000);
  return `${prefix}${num}`;
}

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 90000);
  return `INV-${year}-${num}`;
}

const RATES = {
  local: { base: 9.99, perKg: 1.5 },
  express: { base: 19.99, perKg: 3.0 },
  international: { base: 49.99, perKg: 8.0 },
  freight: { base: 99.99, perKg: 2.0 },
  warehousing: { base: 29.99, perKg: 0.5 },
};

function calculateQuote({ serviceType, weightKg, lengthCm = 0, widthCm = 0, heightCm = 0 }) {
  const rate = RATES[serviceType] || RATES.local;
  const weight = Math.max(parseFloat(weightKg) || 1, 0.5);
  const volumeWeight = lengthCm && widthCm && heightCm
    ? (lengthCm * widthCm * heightCm) / 5000
    : 0;
  const chargeableWeight = Math.max(weight, volumeWeight);
  const price = rate.base + chargeableWeight * rate.perKg;
  const estimatedDays = {
    local: 2,
    express: 1,
    international: 7,
    freight: 5,
    warehousing: 3,
  };
  const delivery = new Date();
  delivery.setDate(delivery.getDate() + (estimatedDays[serviceType] || 3));
  return {
    price: Math.round(price * 100) / 100,
    currency: 'USD',
    chargeableWeight: Math.round(chargeableWeight * 100) / 100,
    estimatedDelivery: delivery.toISOString().split('T')[0],
    serviceType,
  };
}

const STATUS_FLOW = [
  'pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'
];

function getNextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : current;
}

module.exports = {
  generateTrackingNumber,
  generateInvoiceNumber,
  calculateQuote,
  getNextStatus,
  RATES,
};
