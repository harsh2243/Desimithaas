const express = require('express');
const Coupon = require('../models/Coupon');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @route   GET /api/coupons
// @desc    Get all coupons (admin only)
// @access  Private/Admin
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const coupons = await Coupon.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        coupons,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve coupons'
    });
  }
});

// @route   GET /api/coupons/active
// @desc    Get active coupons for users
// @access  Private
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).select('code description type discount minOrderAmount maxDiscountAmount isFirstOrderOnly');

    res.json({
      status: 'success',
      data: { coupons }
    });
  } catch (error) {
    console.error('Get active coupons error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve active coupons'
    });
  }
});

// @route   POST /api/coupons
// @desc    Create new coupon
// @access  Private/Admin
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      discount,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      startDate,
      endDate,
      applicableCategories,
      applicableProducts,
      isFirstOrderOnly
    } = req.body;

    // Validation
    if (!code || !description || !type || !discount || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Code, description, type, discount, and end date are required'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        status: 'error',
        message: 'Coupon code already exists'
      });
    }

    // Validate discount value
    if (type === 'percentage' && (discount <= 0 || discount > 100)) {
      return res.status(400).json({
        status: 'error',
        message: 'Percentage discount must be between 1 and 100'
      });
    }

    if (type === 'fixed' && discount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Fixed discount must be greater than 0'
      });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      type,
      discount: parseFloat(discount),
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
      applicableCategories: applicableCategories || [],
      applicableProducts: applicableProducts || [],
      isFirstOrderOnly: Boolean(isFirstOrderOnly),
      createdBy: req.user._id
    });

    await coupon.save();

    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      status: 'success',
      message: 'Coupon created successfully',
      data: { coupon: populatedCoupon }
    });

  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: Object.values(error.errors)[0].message
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to create coupon'
    });
  }
});

// @route   PUT /api/coupons/:id
// @desc    Update coupon
// @access  Private/Admin
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.createdBy;
    delete updates.usedCount;

    // If code is being updated, check for uniqueness
    if (updates.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: updates.code.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingCoupon) {
        return res.status(400).json({
          status: 'error',
          message: 'Coupon code already exists'
        });
      }
      updates.code = updates.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!coupon) {
      return res.status(404).json({
        status: 'error',
        message: 'Coupon not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Coupon updated successfully',
      data: { coupon }
    });

  } catch (error) {
    console.error('Update coupon error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: Object.values(error.errors)[0].message
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to update coupon'
    });
  }
});

// @route   DELETE /api/coupons/:id
// @desc    Delete coupon
// @access  Private/Admin
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.status(404).json({
        status: 'error',
        message: 'Coupon not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete coupon'
    });
  }
});

// @route   POST /api/coupons/validate
// @desc    Validate coupon code
// @access  Private
router.post('/validate', async (req, res) => {
  try {
    const { code, orderAmount, cartItems, userId } = req.body;

    if (!code || !orderAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Coupon code and order amount are required'
      });
    }

    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!coupon) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid coupon code'
      });
    }

    // Extract categories and product IDs from cart items
    const categories = cartItems ? cartItems.map(item => item.category) : [];
    const productIds = cartItems ? cartItems.map(item => item.productId) : [];

    // Check if it's first order (simplified check)
    const isFirstOrder = true; // You can implement proper first order check here

    // Validate coupon
    const validation = coupon.canBeAppliedTo(orderAmount, categories, productIds, isFirstOrder);

    if (!validation.valid) {
      return res.status(400).json({
        status: 'error',
        message: validation.message
      });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(orderAmount);

    res.json({
      status: 'success',
      message: 'Coupon is valid',
      data: {
        coupon: {
          code: coupon.code,
          type: coupon.type,
          discount: coupon.discount,
          discountAmount
        }
      }
    });

  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to validate coupon'
    });
  }
});

// @route   POST /api/coupons/:id/toggle-status
// @desc    Toggle coupon active status
// @access  Private/Admin
router.post('/:id/toggle-status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        status: 'error',
        message: 'Coupon not found'
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      status: 'success',
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { coupon }
    });

  } catch (error) {
    console.error('Toggle coupon status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle coupon status'
    });
  }
});

module.exports = router;
