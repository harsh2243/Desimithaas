const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:8080',
  'https://desimithaas.vercel.app'
];

const allowedOrigins = [
  ...new Set([
    ...defaultOrigins,
    ...(process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : [])
  ])
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

const mongoUri = process.env.MONGODB_URI;

if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
} else {
  console.warn('⚠️ MONGODB_URI not set. Database-backed routes may fail.');
}

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Thekua Backend API',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      auth: '/api/auth',
      orders: '/api/orders',
      admin: '/api/admin'
    },
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Test endpoint - simple response
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Thekua API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: 'enabled'
  });
});

// Simple error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Auth: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
  });
}

module.exports = app;
