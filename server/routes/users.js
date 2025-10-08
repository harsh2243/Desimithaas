const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Simple auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { firstName, lastName, phone, address },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user cart (simplified)
router.get('/cart', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('cart.product');
    res.json({ cart: user.cart || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to cart
router.post('/cart/add', auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    const user = await User.findById(req.userId);
    
    // Check if product already in cart
    const existingItem = user.cart.find(item => 
      item.product.toString() === productId
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }
    
    await user.save();
    res.json({ message: 'Added to cart', cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove from cart
router.delete('/cart/remove/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.cart = user.cart.filter(item => 
      item.product.toString() !== req.params.productId
    );
    
    await user.save();
    res.json({ message: 'Removed from cart', cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear cart
router.delete('/cart/clear', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.cart = [];
    await user.save();
    
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;