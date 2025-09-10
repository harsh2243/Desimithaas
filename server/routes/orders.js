const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { verifyPaymentSignature } = require('../services/razorpayService');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (User)
router.post('/', [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product.name')
    .notEmpty()
    .withMessage('Product name is required'),
  body('items.*.product.price')
    .isNumeric()
    .withMessage('Product price must be numeric'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress.firstName')
    .notEmpty()
    .withMessage('First name is required'),
  body('shippingAddress.lastName')
    .notEmpty()
    .withMessage('Last name is required'),
  body('shippingAddress.phone')
    .isLength({ min: 10 })
    .withMessage('Valid phone number is required'),
  body('shippingAddress.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('shippingAddress.street')
    .notEmpty()
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.postalCode')
    .isLength({ min: 5, max: 7 })
    .withMessage('Postal code must be 5-7 digits'),
  body('paymentMethod')
    .isIn(['cod', 'razorpay', 'upi'])
    .withMessage('Invalid payment method')
], async (req, res) => {
  try {
    console.log('Creating order - Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      items, 
      shippingAddress, 
      paymentMethod, 
      paymentDetails,
      totalAmount,
      subtotal,
      shippingCost,
      notes 
    } = req.body;

    console.log('Creating order with data:', {
      paymentMethod,
      paymentDetails,
      totalAmount,
      itemsCount: items?.length,
      userId: req.user._id
    });

    // Verify Razorpay payment if payment method is razorpay
    if (paymentMethod === 'razorpay' && paymentDetails) {
      const { orderId, paymentId, signature } = paymentDetails;
      
      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing payment verification details'
        });
      }

      // Verify payment signature
      const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);
      
      if (!isValidSignature) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid payment signature'
        });
      }

      console.log('Razorpay payment verified successfully');
    }

    // Calculate shipping (free for orders above ₹500)
    const calculatedShipping = subtotal >= 500 ? 0 : 50;

    // Determine initial order status based on payment method
    let initialOrderStatus = 'pending';
    let initialPaymentStatus = 'pending';

    if (paymentMethod === 'cod') {
      // COD orders start as pending, waiting for admin confirmation
      initialOrderStatus = 'pending';
      initialPaymentStatus = 'pending';
    } else if (paymentMethod === 'razorpay' && paymentDetails) {
      // Razorpay orders are confirmed after payment
      initialOrderStatus = 'confirmed';
      initialPaymentStatus = 'completed';
    } else if (paymentMethod === 'upi') {
      // UPI orders are confirmed after payment simulation (paymentDetails optional for simulation)
      initialOrderStatus = 'confirmed';
      initialPaymentStatus = 'completed';
    } else if (paymentMethod === 'razorpay' && !paymentDetails) {
      // Razorpay without payment details should fail
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification required for Razorpay orders'
      });
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      items: items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      shippingAddress: {
        fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        phone: shippingAddress.phone,
        email: shippingAddress.email,
        address: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.postalCode,
        country: shippingAddress.country || 'India'
      },
      paymentMethod,
      orderStatus: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      totalAmount: totalAmount || subtotal + calculatedShipping,
      shippingCharge: shippingCost || calculatedShipping,
      notes,
      paymentDetails: paymentDetails || null
    });

    await order.save();

    // Populate user info
    await order.populate('user', 'firstName lastName email');

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order'
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private (User)
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/orders - Auth check:', {
      hasUser: !!req.user,
      userId: req.user?._id,
      hasAuthHeader: !!req.headers.authorization
    });

    if (!req.user || !req.user._id) {
      console.log('GET /api/orders - Authentication failed: No user in request');
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in to view your orders.'
      });
    }

    const {
      page = 1,
      limit = 10,
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('GET /api/orders - Query params:', { page, limit, status, sortBy, sortOrder });

    // Build filter
    const filter = { user: req.user._id };
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with detailed information matching customer "My Orders" view
    const orders = await Order.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('user', 'firstName lastName email phone')
      .select('orderNumber orderStatus paymentStatus paymentMethod totalAmount shippingCharge discount finalAmount createdAt items shippingAddress notes estimatedDelivery deliveredAt');

    console.log(`Fetching orders for user ${req.user._id}, found ${orders.length} orders`);
    if (orders.length > 0) {
      console.log('Order statuses:', orders.map(o => ({ orderNumber: o.orderNumber, status: o.orderStatus })));
    }

    // Get total count
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.json({
      status: 'success',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders'
    });
  }
});

// @route   GET /api/orders/:orderId
// @desc    Get specific order details
// @access  Private (User)
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    res.json({
      status: 'success',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order details'
    });
  }
});

// @route   PUT /api/orders/:orderId/cancel
// @desc    Cancel order
// @access  Private (User)
router.put('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied'
      });
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Cancel order
    order.orderStatus = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by customer';
    await order.save();

    res.json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order'
    });
  }
});

// Admin routes
// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private (Admin)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      search = '',
      paymentStatus = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // First, get all admin user IDs to exclude their orders
    const User = require('../models/User');
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminUserIds = adminUsers.map(admin => admin._id);

    // Build filter - exclude admin users' orders
    const filter = {
      user: { $nin: adminUserIds } // Exclude orders from admin users
    };
    
    if (status) {
      filter.orderStatus = status;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders
    const orders = await Order.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('user', 'firstName lastName email phone');

    // Get total count
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    // Get order statistics - exclude admin users' orders
    const stats = await Order.aggregate([
      {
        $match: {
          user: { $nin: adminUserIds } // Exclude admin users' orders from stats
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] }
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'confirmed'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'shipped'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 1, 0] }
          },
          codOrders: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cod'] }, 1, 0] }
          },
          onlineOrders: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      status: 'success',
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        stats: stats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          confirmedOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          codOrders: 0,
          onlineOrders: 0
        }
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders'
    });
  }
});

// @route   PUT /api/orders/admin/:orderId
// @desc    Update order status (Admin only)
// @access  Private (Admin)
router.put('/admin/:orderId', requireAdmin, [
  body('orderStatus')
    .optional()
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  body('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),
  body('trackingNumber')
    .optional()
    .isString()
    .withMessage('Tracking number must be a string'),
  body('estimatedDelivery')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for estimated delivery')
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

    const { orderId } = req.params;
    const allowedUpdates = [
      'orderStatus', 'paymentStatus', 'trackingNumber', 
      'estimatedDelivery', 'adminNotes'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const order = await Order.findByIdAndUpdate(
      orderId,
      updates,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email phone');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Order updated successfully',
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order'
    });
  }
});

// @route   GET /api/orders/admin/dashboard
// @desc    Get order dashboard stats (Admin only)
// @access  Private (Admin)
router.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get all admin user IDs to exclude their orders
    const User = require('../models/User');
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminUserIds = adminUsers.map(admin => admin._id);

    // Order statistics - exclude admin users' orders
    const orderStats = await Order.aggregate([
      {
        $match: {
          user: { $nin: adminUserIds } // Exclude admin users' orders
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          averageOrderValue: { $avg: '$finalAmount' },
          totalShippingRevenue: { $sum: '$shippingCharge' },
          totalDiscountGiven: { $sum: '$discount' },
          ordersToday: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfDay] }, 1, 0]
            }
          },
          ordersThisWeek: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfWeek] }, 1, 0]
            }
          },
          ordersThisMonth: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0]
            }
          },
          revenueToday: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', startOfDay] },
                '$finalAmount',
                0
              ]
            }
          },
          revenueThisWeek: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', startOfWeek] },
                '$finalAmount',
                0
              ]
            }
          },
          revenueThisMonth: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', startOfMonth] },
                '$finalAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    // Recent orders - exclude admin users' orders, show real customer order details
    const recentOrders = await Order.find({
      user: { $nin: adminUserIds } // Exclude admin users' orders
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email phone')
      .select('orderNumber orderStatus paymentStatus paymentMethod totalAmount shippingCharge finalAmount createdAt items shippingAddress notes');

    // Order status distribution - exclude admin users' orders
    const statusDistribution = await Order.aggregate([
      {
        $match: {
          user: { $nin: adminUserIds } // Exclude admin users' orders
        }
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      }
    ]);

    // Payment method distribution for real business insights
    const paymentMethodDistribution = await Order.aggregate([
      {
        $match: {
          user: { $nin: adminUserIds }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      }
    ]);

    // Top products from real customer orders
    const topProducts = await Order.aggregate([
      {
        $match: {
          user: { $nin: adminUserIds }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product.name',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      status: 'success',
      data: {
        orderStats: orderStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          totalShippingRevenue: 0,
          totalDiscountGiven: 0,
          ordersToday: 0,
          ordersThisWeek: 0,
          ordersThisMonth: 0,
          revenueToday: 0,
          revenueThisWeek: 0,
          revenueThisMonth: 0
        },
        recentOrders,
        statusDistribution,
        paymentMethodDistribution,
        topProducts
      }
    });

  } catch (error) {
    console.error('Order dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order dashboard data'
    });
  }
});

module.exports = router;
