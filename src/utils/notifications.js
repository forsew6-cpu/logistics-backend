const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function createNotification({ userId, title, message, type = 'info', link = null }) {
  const id = uuidv4();
  db.prepare(
    'INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, userId, title, message, type, link);
  return id;
}

module.exports = { createNotification };
