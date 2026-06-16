const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { generateToken, authenticate } = require('../middleware/auth');
const { formatUser } = require('../utils/formatters');

const router = express.Router();

router.post('/register', (req, res) => {
  const { email, password, firstName, lastName, phone, role = 'customer' } = req.body;
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!['customer', 'driver'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role for registration' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, email, hash, firstName, lastName, phone || null, role);
  const user = db.prepare('SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = ?').get(id);
  const token = generateToken(user);
  res.status(201).json({ user: formatUser(user), token });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(user);
  res.json({ user: formatUser(user), token });
});

router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, first_name, last_name, phone, role, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: formatUser(user) });
});

router.put('/me', authenticate, (req, res) => {
  const { firstName, lastName, phone } = req.body;
  db.prepare(
    'UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), phone = COALESCE(?, phone), updated_at = datetime(\'now\') WHERE id = ?'
  ).run(firstName, lastName, phone, req.user.id);
  const user = db.prepare('SELECT id, email, first_name, last_name, phone, role, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: formatUser(user) });
});

router.put('/password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(hash, req.user.id);
  res.json({ message: 'Password updated' });
});

module.exports = router;
