const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Simple CORS - allow everything for localhost
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001', 'file://'],
  credentials: true
}));

app.use(express.json());

// Enhanced User Schema with Admin Role
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: String,
  isAdmin: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, 'secret123');
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Admin Middleware
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user.isAdmin && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    res.status(403).json({ message: 'Access denied.' });
  }
};

// Connect to MongoDB
mongoose.connect('mongodb+srv://ar7220487:BeqSER64EF7D874E@cluster0.qweqxpj.mongodb.net/thekua-website')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// USER REGISTER ROUTE
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('User Register request:', req.body);
    
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create user
    const user = new User({ 
      firstName, 
      lastName, 
      email, 
      password, 
      phone,
      role: 'user',
      isAdmin: false
    });
    await user.save();
    
    // Create token
    const token = jwt.sign({ userId: user._id }, 'secret123', { expiresIn: '7d' });
    
    console.log('✅ User registered:', email);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { 
        id: user._id, 
        firstName, 
        lastName, 
        email, 
        phone,
        role: user.role,
        isAdmin: user.isAdmin
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// USER LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('User Login request:', req.body);
    
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Create token
    const token = jwt.sign({ userId: user._id }, 'secret123', { expiresIn: '7d' });
    
    console.log('✅ User logged in:', email);
    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: user.isAdmin,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// ADMIN REGISTER ROUTE
app.post('/api/admin/register', async (req, res) => {
  try {
    console.log('Admin Register request:', req.body);
    
    const { firstName, lastName, email, password, phone, adminKey } = req.body;
    
    // Check admin key (simple security measure)
    if (adminKey !== 'DESIMITHAS_ADMIN_2025') {
      return res.status(403).json({ message: 'Invalid admin key' });
    }
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create admin user
    const user = new User({ 
      firstName, 
      lastName, 
      email, 
      password, 
      phone,
      role: 'admin',
      isAdmin: true
    });
    await user.save();
    
    // Create token
    const token = jwt.sign({ userId: user._id }, 'secret123', { expiresIn: '7d' });
    
    console.log('✅ Admin registered:', email);
    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: { 
        id: user._id, 
        firstName, 
        lastName, 
        email, 
        phone,
        role: user.role,
        isAdmin: user.isAdmin
      }
    });
    
  } catch (error) {
    console.error('Admin Register error:', error);
    res.status(500).json({ message: 'Admin registration failed', error: error.message });
  }
});

// ADMIN LOGIN ROUTE
app.post('/api/admin/login', async (req, res) => {
  try {
    console.log('Admin Login request:', req.body);
    
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find admin user
    const user = await User.findOne({ 
      email, 
      isActive: true, 
      $or: [{ isAdmin: true }, { role: 'admin' }, { role: 'superadmin' }]
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Create token
    const token = jwt.sign({ userId: user._id }, 'secret123', { expiresIn: '7d' });
    
    console.log('✅ Admin logged in:', email);
    res.json({
      message: 'Admin login successful',
      token,
      user: { 
        id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: user.isAdmin,
        lastLogin: user.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Admin Login error:', error);
    res.status(500).json({ message: 'Admin login failed', error: error.message });
  }
});

// PROTECTED USER PROFILE ROUTE
app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        isAdmin: req.user.isAdmin,
        createdAt: req.user.createdAt,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// ADMIN DASHBOARD ROUTE
app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ isAdmin: true });
    const activeUsers = await User.countDocuments({ isActive: true });
    
    res.json({
      message: 'Admin dashboard data',
      stats: {
        totalUsers,
        totalAdmins,
        activeUsers
      },
      admin: {
        id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// TEST ROUTE
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Start server
const PORT = 3001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`� User Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`� User Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`👨‍💼 Admin Login: POST http://localhost:${PORT}/api/admin/login`);
  console.log(`👨‍💼 Admin Register: POST http://localhost:${PORT}/api/admin/register`);
  console.log(`🧪 Test: GET http://localhost:${PORT}/api/test`);
});

module.exports = app;