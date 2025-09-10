const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireOwnershipOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('orders')
      .populate('wishlist')
      .populate('cart.product');
    
    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  authenticateToken,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('Please provide a valid phone number (7-15 digits, optional + prefix)'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'dateOfBirth',
      'address', 'preferences'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

// @route   POST /api/users/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/cart/add', [
  authenticateToken,
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user._id);
    
    // Check if item already exists in cart
    const existingItem = user.cart.find(item => 
      item.product.toString() === productId
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({
        product: productId,
        quantity,
        addedAt: new Date()
      });
    }
    
    await user.save();
    
    // Populate cart items
    await user.populate('cart.product');
    
    res.json({
      status: 'success',
      message: 'Item added to cart successfully',
      data: {
        cart: user.cart
      }
    });
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add item to cart'
    });
  }
});

// @route   PUT /api/users/cart/update
// @desc    Update cart item quantity
// @access  Private
router.put('/cart/update', [
  authenticateToken,
  body('productId').isMongoId().withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be 0 or greater')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user._id);
    
    if (quantity === 0) {
      // Remove item from cart
      user.cart = user.cart.filter(item => 
        item.product.toString() !== productId
      );
    } else {
      // Update quantity
      const existingItem = user.cart.find(item => 
        item.product.toString() === productId
      );
      
      if (existingItem) {
        existingItem.quantity = quantity;
      } else {
        return res.status(404).json({
          status: 'error',
          message: 'Item not found in cart'
        });
      }
    }
    
    await user.save();
    await user.populate('cart.product');
    
    res.json({
      status: 'success',
      message: 'Cart updated successfully',
      data: {
        cart: user.cart
      }
    });
    
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update cart'
    });
  }
});

// @route   DELETE /api/users/cart/clear
// @desc    Clear user's cart
// @access  Private
router.delete('/cart/clear', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Cart cleared successfully'
    });
    
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear cart'
    });
  }
});

// @route   POST /api/users/wishlist/toggle
// @desc    Add/remove item from wishlist
// @access  Private
router.post('/wishlist/toggle', [
  authenticateToken,
  body('productId').isMongoId().withMessage('Invalid product ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    
    const itemIndex = user.wishlist.indexOf(productId);
    
    if (itemIndex > -1) {
      // Remove from wishlist
      user.wishlist.splice(itemIndex, 1);
      var message = 'Item removed from wishlist';
    } else {
      // Add to wishlist
      user.wishlist.push(productId);
      var message = 'Item added to wishlist';
    }
    
    await user.save();
    await user.populate('wishlist');
    
    res.json({
      status: 'success',
      message,
      data: {
        wishlist: user.wishlist
      }
    });
    
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update wishlist'
    });
  }
});

// @route   DELETE /api/users/:userId
// @desc    Delete user account
// @access  Private (Owner or Admin)
router.delete('/:userId', [authenticateToken, requireOwnershipOrAdmin], async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();
    
    res.json({
      status: 'success',
      message: 'Account deactivated successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user account'
    });
  }
});

module.exports = router;
