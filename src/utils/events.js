const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function createShipmentEvent({ shipmentId, status, location, description }) {
  const id = uuidv4();
  db.prepare(
    'INSERT INTO shipment_events (id, shipment_id, status, location, description) VALUES (?, ?, ?, ?, ?)'
  ).run(id, shipmentId, status, location, description);
  return id;
}

module.exports = { createShipmentEvent };
