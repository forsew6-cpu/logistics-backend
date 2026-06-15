const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');
const quoteRoutes = require('./routes/quotes');
const userRoutes = require('./routes/users');
const warehouseRoutes = require('./routes/warehouses');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Initialize database
require('./db');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Serve frontend static files
const publicDir = path.join(__dirname, '../../frontend');
app.use(express.static(publicDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/analytics', analyticsRoutes);

// Contact form endpoint
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }
  console.log(`Contact form: ${name} <${email}> - ${subject}: ${message}`);
  res.json({ message: 'Thank you for contacting us. We will respond within 24 hours.' });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback for dashboard routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const filePath = path.join(publicDir, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`NexaLogistics server running at http://localhost:${PORT}`);
});
