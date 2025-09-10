const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload, deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

const router = express.Router();

// Apply authentication and admin requirement to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get comprehensive dashboard overview with real data
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get all admin user IDs to exclude their orders and data
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminUserIds = adminUsers.map(admin => admin._id);

    // 1. OVERVIEW METRICS
    const [orderStats, customerStats, productStats, revenueStats] = await Promise.all([
      // Order Statistics
      Order.aggregate([
        { $match: { user: { $nin: adminUserIds } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            ordersToday: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfDay] }, 1, 0] }
            },
            ordersThisWeek: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfWeek] }, 1, 0] }
            },
            ordersThisMonth: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] }
            },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] }
            },
            processingOrders: {
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
            }
          }
        }
      ]),

      // Customer Statistics
      User.aggregate([
        { $match: { role: { $ne: 'admin' } } },
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            activeCustomers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            newCustomersToday: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfDay] }, 1, 0] }
            },
            newCustomersThisMonth: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] }
            },
            verifiedCustomers: {
              $sum: { $cond: [{ $eq: ['$emailVerified', true] }, 1, 0] }
            }
          }
        }
      ],),

      // Product Statistics
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            featuredProducts: {
              $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] }
            },
            outOfStockProducts: {
              $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
            },
            lowStockProducts: {
              $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 10] }] }, 1, 0] }
            },
            totalViews: { $sum: '$views' },
            totalSold: { $sum: '$soldCount' }
          }
        }
      ]),

      // Revenue Statistics
      Order.aggregate([
        { $match: { user: { $nin: adminUserIds } } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalAmount' },
            revenueToday: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfDay] }, '$finalAmount', 0] }
            },
            revenueThisWeek: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfWeek] }, '$finalAmount', 0] }
            },
            revenueThisMonth: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, '$finalAmount', 0] }
            },
            revenueThisYear: {
              $sum: { $cond: [{ $gte: ['$createdAt', startOfYear] }, '$finalAmount', 0] }
            },
            avgOrderValue: { $avg: '$finalAmount' },
            codRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'cod'] }, '$finalAmount', 0] }
            },
            onlineRevenue: {
              $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, '$finalAmount', 0] }
            }
          }
        }
      ])
    ]);

    // 2. TOP PERFORMING PRODUCTS
    const topProducts = await Order.aggregate([
      { $match: { user: { $nin: adminUserIds } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product.name',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          avgPrice: { $avg: '$items.price' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // 3. RECENT ORDERS
    const recentOrders = await Order.find({ user: { $nin: adminUserIds } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'firstName lastName email')
      .select('orderNumber orderStatus finalAmount paymentMethod createdAt user items');

    // 4. ORDER STATUS DISTRIBUTION
    const orderStatusDistribution = await Order.aggregate([
      { $match: { user: { $nin: adminUserIds } } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 5. PAYMENT METHOD DISTRIBUTION
    const paymentMethodDistribution = await Order.aggregate([
      { $match: { user: { $nin: adminUserIds } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 6. MONTHLY REVENUE TREND (Last 12 months)
    const monthlyRevenue = await Order.aggregate([
      { $match: { user: { $nin: adminUserIds } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // 7. TOP CUSTOMERS
    const topCustomers = await Order.aggregate([
      { $match: { user: { $nin: adminUserIds } } },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$finalAmount' },
          avgOrderValue: { $avg: '$finalAmount' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 }
    ]);

    // Populate customer details
    await User.populate(topCustomers, {
      path: '_id',
      select: 'firstName lastName email'
    });

    // Format response
    const overview = {
      orders: orderStats[0] || {
        totalOrders: 0, ordersToday: 0, ordersThisWeek: 0, ordersThisMonth: 0,
        pendingOrders: 0, processingOrders: 0, shippedOrders: 0, deliveredOrders: 0, cancelledOrders: 0
      },
      customers: customerStats[0] || {
        totalCustomers: 0, activeCustomers: 0, newCustomersToday: 0, newCustomersThisMonth: 0, verifiedCustomers: 0
      },
      products: productStats[0] || {
        totalProducts: 0, activeProducts: 0, featuredProducts: 0, outOfStockProducts: 0, lowStockProducts: 0, totalViews: 0, totalSold: 0
      },
      revenue: revenueStats[0] || {
        totalRevenue: 0, revenueToday: 0, revenueThisWeek: 0, revenueThisMonth: 0, revenueThisYear: 0,
        avgOrderValue: 0, codRevenue: 0, onlineRevenue: 0
      }
    };

    res.json({
      status: 'success',
      data: {
        overview,
        topProducts,
        recentOrders,
        orderStatusDistribution,
        paymentMethodDistribution,
        monthlyRevenue,
        topCustomers: topCustomers.map(customer => ({
          customer: customer._id,
          totalOrders: customer.totalOrders,
          totalSpent: customer.totalSpent,
          avgOrderValue: customer.avgOrderValue,
          lastOrderDate: customer.lastOrderDate
        }))
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// @route   GET /api/admin/dashboard/stats
// @desc    Get dashboard statistics
// @access  Admin
router.get('/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get all admin user IDs to exclude their orders and data
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminUserIds = adminUsers.map(admin => admin._id);

    // Basic stats
    const [totalOrders, totalCustomers, totalProducts, totalRevenue] = await Promise.all([
      Order.countDocuments({ user: { $nin: adminUserIds } }),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { user: { $nin: adminUserIds }, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Today's stats
    const [ordersToday, revenueToday] = await Promise.all([
      Order.countDocuments({ 
        user: { $nin: adminUserIds },
        createdAt: { $gte: startOfDay }
      }),
      Order.aggregate([
        { 
          $match: { 
            user: { $nin: adminUserIds }, 
            paymentStatus: 'completed',
            createdAt: { $gte: startOfDay }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // This month's stats
    const [ordersThisMonth, revenueThisMonth] = await Promise.all([
      Order.countDocuments({ 
        user: { $nin: adminUserIds },
        createdAt: { $gte: startOfMonth }
      }),
      Order.aggregate([
        { 
          $match: { 
            user: { $nin: adminUserIds }, 
            paymentStatus: 'completed',
            createdAt: { $gte: startOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.json({
      status: 'success',
      data: {
        overview: {
          totalOrders,
          totalCustomers,
          totalProducts,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        today: {
          orders: ordersToday,
          revenue: revenueToday[0]?.total || 0
        },
        thisMonth: {
          orders: ordersThisMonth,
          revenue: revenueThisMonth[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// @route   GET /api/admin/dashboard/quick-actions
// @desc    Get quick actions data
// @access  Admin
router.get('/dashboard/quick-actions', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Get all admin user IDs to exclude their orders and data
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminUserIds = adminUsers.map(admin => admin._id);

    const [pendingOrders, lowStockProducts, newCustomers, todayStats] = await Promise.all([
      // Pending orders
      Order.find({ 
        user: { $nin: adminUserIds },
        status: 'pending' 
      }).countDocuments(),

      // Low stock products
      Product.find({ stock: { $lte: 10 }, isActive: true }).countDocuments(),

      // New customers today
      User.find({ 
        role: 'user',
        createdAt: { $gte: startOfDay }
      }).countDocuments(),

      // Today's order and revenue stats
      Order.aggregate([
        { 
          $match: { 
            user: { $nin: adminUserIds },
            createdAt: { $gte: startOfDay }
          } 
        },
        {
          $group: {
            _id: null,
            ordersToday: { $sum: 1 },
            revenueToday: { $sum: '$totalAmount' }
          }
        }
      ])
    ]);

    res.json({
      status: 'success',
      data: {
        pendingOrders,
        lowStockProducts,
        newCustomers,
        ordersToday: todayStats[0]?.ordersToday || 0,
        revenueToday: todayStats[0]?.revenueToday || 0
      }
    });
  } catch (error) {
    console.error('Quick actions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch quick actions data'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Admin
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      isActive = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (isActive !== '') {
      filter.isActive = isActive === 'true';
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get users
    const users = await User.find(filter)
      .select('-password')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('orders', 'orderNumber totalAmount status createdAt');
    
    // Get total count
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));
    
    // Get user statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          newUsersThisMonth: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$createdAt',
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        stats: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          newUsersThisMonth: 0
        }
      }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// @route   GET /api/admin/users/:userId
// @desc    Get specific user details
// @access  Admin
router.get('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('orders')
      .populate('wishlist')
      .populate('cart.product');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.json({
      status: 'success',
      data: {
        user
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user details'
    });
  }
});

// @route   PUT /api/admin/users/:userId
// @desc    Update user details
// @access  Admin
router.put('/users/:userId', [
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
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
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
    
    const { userId } = req.params;
    
    // Prevent admin from deactivating themselves
    if (userId === req.user._id.toString() && req.body.isActive === false) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot deactivate your own account'
      });
    }
    
    // Check if email is being changed and is already taken
    if (req.body.email) {
      const existingUser = await User.findOne({
        email: req.body.email,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already taken'
        });
      }
    }
    
    const allowedUpdates = [
      'firstName', 'lastName', 'email', 'phone', 'role',
      'isActive', 'address', 'preferences'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user
      }
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
});

// @route   DELETE /api/admin/users/:userId
// @desc    Delete user (hard delete)
// @access  Admin
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check if it's the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete the last admin account'
        });
      }
    }
    
    await User.findByIdAndDelete(userId);
    
    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
  }
});

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Admin
router.post('/users', authenticateToken, requireAdmin, [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
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
    
    const { firstName, lastName, email, password, role = 'user', phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      emailVerified: true // Admin created users are auto-verified
    });
    
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: userResponse
      }
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user'
    });
  }
});

// @route   GET /api/admin/customers
// @desc    Get all customers with pagination and filters
// @access  Private (Admin)
router.get('/customers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive = '' } = req.query;
    
    // Build filter object
    const filter = { role: { $ne: 'admin' } }; // Exclude admin users
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== '') {
      filter.isActive = isActive === 'true';
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get customers with order statistics
    const customers = await User.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalSpent: { $sum: '$orders.finalAmount' },
          averageOrderValue: {
            $cond: {
              if: { $gt: [{ $size: '$orders' }, 0] },
              then: { $divide: [{ $sum: '$orders.finalAmount' }, { $size: '$orders' }] },
              else: 0
            }
          },
          lastOrderDate: {
            $max: '$orders.createdAt'
          }
        }
      },
      { $project: { password: 0, orders: 0 } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);
    
    // Get total count
    const totalCustomers = await User.countDocuments(filter);
    
    res.json({
      status: 'success',
      data: {
        customers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCustomers / parseInt(limit)),
          totalCustomers,
          hasNextPage: parseInt(page) < Math.ceil(totalCustomers / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customers'
    });
  }
});

// @route   GET /api/admin/customers/stats
// @desc    Get customer statistics
// @access  Private (Admin)
router.get('/customers/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get basic customer stats
    const totalCustomers = await User.countDocuments({ role: { $ne: 'admin' } });
    const activeCustomers = await User.countDocuments({ role: { $ne: 'admin' }, isActive: true });
    const newCustomersToday = await User.countDocuments({ 
      role: { $ne: 'admin' }, 
      createdAt: { $gte: todayStart } 
    });
    const newCustomersThisWeek = await User.countDocuments({ 
      role: { $ne: 'admin' }, 
      createdAt: { $gte: weekStart } 
    });
    const newCustomersThisMonth = await User.countDocuments({ 
      role: { $ne: 'admin' }, 
      createdAt: { $gte: monthStart } 
    });
    
    // Get top spenders
    const topSpenders = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalSpent: { $sum: '$orders.finalAmount' }
        }
      },
      { $match: { totalSpent: { $gt: 0 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      { $project: { password: 0, orders: 0 } }
    ]);
    
    res.json({
      status: 'success',
      data: {
        totalCustomers,
        activeCustomers,
        newCustomersToday,
        newCustomersThisWeek,
        newCustomersThisMonth,
        topSpenders
      }
    });
    
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch customer statistics'
    });
  }
});

// @route   PUT /api/admin/customers/:customerId
// @desc    Update customer status
// @access  Private (Admin)
router.put('/customers/:customerId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { isActive } = req.body;
    
    const customer = await User.findByIdAndUpdate(
      customerId,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found'
      });
    }
    
    res.json({
      status: 'success',
      data: { customer }
    });
    
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update customer'
    });
  }
});

// @route   GET /api/admin/orders/stats
// @desc    Get order statistics
// @access  Private (Admin)
router.get('/orders/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get order statistics
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
    const confirmedOrders = await Order.countDocuments({ orderStatus: 'confirmed' });
    const shippedOrders = await Order.countDocuments({ orderStatus: 'shipped' });
    const deliveredOrders = await Order.countDocuments({ orderStatus: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ orderStatus: 'cancelled' });
    
    // Get revenue statistics
    const revenueStats = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          averageOrderValue: { $avg: '$finalAmount' }
        }
      }
    ]);
    
    const todaysStats = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: todayStart },
          orderStatus: { $ne: 'cancelled' }
        } 
      },
      {
        $group: {
          _id: null,
          todaysOrders: { $sum: 1 },
          todaysRevenue: { $sum: '$finalAmount' }
        }
      }
    ]);
    
    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const averageOrderValue = revenueStats[0]?.averageOrderValue || 0;
    const todaysOrders = todaysStats[0]?.todaysOrders || 0;
    const todaysRevenue = todaysStats[0]?.todaysRevenue || 0;
    
    res.json({
      status: 'success',
      data: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
        todaysOrders,
        todaysRevenue
      }
    });
    
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order statistics'
    });
  }
});

// @route   GET /api/admin/quick-actions
// @desc    Get quick actions data
// @access  Admin
router.get('/quick-actions', async (req, res) => {
  try {
    // Get all admin user IDs to exclude their data
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminUserIds = adminUsers.map(admin => admin._id);

    const [pendingOrders, lowStockProducts, newCustomers, todayStats] = await Promise.all([
      // Pending orders
      Order.find({ 
        orderStatus: 'pending',
        user: { $nin: adminUserIds }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email')
      .select('orderNumber finalAmount createdAt user'),

      // Low stock products
      Product.find({ 
        stock: { $lte: 10, $gt: 0 },
        isActive: true 
      })
      .sort({ stock: 1 })
      .limit(5)
      .select('name stock category'),

      // New customers (last 7 days)
      User.find({
        role: { $ne: 'admin' },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email createdAt'),

      // Today's stats
      Promise.all([
        Order.countDocuments({
          user: { $nin: adminUserIds },
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }),
        Order.aggregate([
          {
            $match: {
              user: { $nin: adminUserIds },
              createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$finalAmount' }
            }
          }
        ])
      ])
    ]);

    res.json({
      status: 'success',
      data: {
        pendingOrders,
        lowStockProducts,
        newCustomers,
        todayStats: {
          ordersToday: todayStats[0],
          revenueToday: todayStats[1][0]?.totalRevenue || 0
        }
      }
    });

  } catch (error) {
    console.error('Quick actions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch quick actions data'
    });
  }
});

// @route   GET /api/admin/export/orders
// @desc    Export orders data as CSV
// @access  Admin
router.get('/export/orders', async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Get all admin user IDs to exclude their orders
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminUserIds = adminUsers.map(admin => admin._id);

    // Build filter
    const filter = { user: { $nin: adminUserIds } };
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (status) {
      filter.orderStatus = status;
    }

    // Get orders
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email phone')
      .select('orderNumber orderStatus paymentMethod paymentStatus finalAmount totalAmount shippingCharge discount items shippingAddress createdAt');

    // Convert to CSV format
    const csvHeader = 'Order Number,Customer Name,Email,Phone,Order Status,Payment Method,Total Amount,Shipping,Discount,Final Amount,Order Date,Items,Shipping Address\n';
    
    const csvData = orders.map(order => {
      const customerName = `${order.user.firstName} ${order.user.lastName}`;
      const items = order.items.map(item => `${item.product.name} (${item.quantity})`).join('; ');
      const address = `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`;
      
      return [
        order.orderNumber,
        customerName,
        order.user.email,
        order.user.phone || '',
        order.orderStatus,
        order.paymentMethod,
        order.totalAmount,
        order.shippingCharge,
        order.discount,
        order.finalAmount,
        order.createdAt.toISOString().split('T')[0],
        `"${items}"`,
        `"${address}"`
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export orders'
    });
  }
});

// @route   GET /api/admin/export/customers
// @desc    Export customers data as CSV
// @access  Admin
router.get('/export/customers', async (req, res) => {
  try {
    // Get customers with order statistics
    const customers = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalSpent: { $sum: '$orders.finalAmount' },
          lastOrderDate: { $max: '$orders.createdAt' }
        }
      },
      {
        $project: {
          password: 0,
          orders: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Convert to CSV format
    const csvHeader = 'Customer Name,Email,Phone,Join Date,Email Verified,Active,Total Orders,Total Spent,Last Order Date\n';
    
    const csvData = customers.map(customer => {
      const customerName = `${customer.firstName} ${customer.lastName}`;
      const lastOrderDate = customer.lastOrderDate ? new Date(customer.lastOrderDate).toISOString().split('T')[0] : 'Never';
      
      return [
        customerName,
        customer.email,
        customer.phone || '',
        new Date(customer.createdAt).toISOString().split('T')[0],
        customer.emailVerified ? 'Yes' : 'No',
        customer.isActive ? 'Yes' : 'No',
        customer.totalOrders,
        customer.totalSpent || 0,
        lastOrderDate
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export customers'
    });
  }
});

// @route   GET /api/admin/export/products
// @desc    Export products data as CSV
// @access  Admin
router.get('/export/products', async (req, res) => {
  try {
    // Get products with sales data
    const products = await Product.aggregate([
      {
        $addFields: {
          stockStatus: {
            $cond: {
              if: { $eq: ['$stock', 0] },
              then: 'out-of-stock',
              else: {
                $cond: {
                  if: { $lte: ['$stock', 10] },
                  then: 'low-stock',
                  else: 'in-stock'
                }
              }
            }
          },
          discountedPrice: {
            $cond: {
              if: { $gt: ['$discount', 0] },
              then: { $subtract: ['$price', { $multiply: ['$price', { $divide: ['$discount', 100] }] }] },
              else: '$price'
            }
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Convert to CSV format
    const csvHeader = 'Product Name,Category,Price,Discounted Price,Discount %,Stock,Stock Status,Sold Count,Views,Rating,Active,Featured,Created Date\n';
    
    const csvData = products.map(product => {
      return [
        `"${product.name}"`,
        product.category,
        product.price,
        Math.round(product.discountedPrice * 100) / 100,
        product.discount,
        product.stock,
        product.stockStatus,
        product.soldCount,
        product.views,
        product.ratings.average,
        product.isActive ? 'Yes' : 'No',
        product.isFeatured ? 'Yes' : 'No',
        new Date(product.createdAt).toISOString().split('T')[0]
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export products'
    });
  }
});

// ==============================================
// PRODUCT MANAGEMENT ROUTES
// ==============================================

// @route   GET /api/admin/products
// @desc    Get all products for admin management
// @access  Admin
router.get('/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category = '',
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products',
      error: error.message 
    });
  }
});

// @route   POST /api/admin/products
// @desc    Create new product
// @access  Admin
router.post('/products', upload.single('mainImage'), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').notEmpty().withMessage('Description is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const {
      name,
      description,
      price,
      discount = 0,
      category,
      tags,
      stock = 0,
      isActive = true,
      isFeatured = false
    } = req.body;

    // Handle image upload
    let mainImage = '';
    if (req.file) {
      mainImage = req.file.path; // Cloudinary URL
    }

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      discount: parseFloat(discount),
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      stock: parseInt(stock),
      mainImage,
      isActive: isActive === 'true' || isActive === true,
      isFeatured: isFeatured === 'true' || isFeatured === true
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create product',
      error: error.message 
    });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update product
// @access  Admin
router.put('/products/:id', upload.single('mainImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle numeric fields
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.discount) updateData.discount = parseFloat(updateData.discount);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);

    // Handle boolean fields
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;
    }
    if (updateData.isFeatured !== undefined) {
      updateData.isFeatured = updateData.isFeatured === 'true' || updateData.isFeatured === true;
    }

    // Handle tags
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }

    // Handle new image upload
    if (req.file) {
      // Get the old product to delete old image
      const oldProduct = await Product.findById(id);
      if (oldProduct && oldProduct.mainImage) {
        try {
          const publicId = getPublicIdFromUrl(oldProduct.mainImage);
          if (publicId) {
            await deleteImage(publicId);
          }
        } catch (deleteError) {
          console.warn('Failed to delete old image:', deleteError);
        }
      }
      updateData.mainImage = req.file.path;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update product',
      error: error.message 
    });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete product
// @access  Admin
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Delete image from Cloudinary
    if (product.mainImage) {
      try {
        const publicId = getPublicIdFromUrl(product.mainImage);
        if (publicId) {
          await deleteImage(publicId);
        }
      } catch (deleteError) {
        console.warn('Failed to delete image:', deleteError);
      }
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete product',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/products/:id
// @desc    Get single product for editing
// @access  Admin
router.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch product',
      error: error.message 
    });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders for admin management
// @access  Private (Admin)
router.get('/orders', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    // Add search functionality
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

    // Get orders with detailed information
    const orders = await Order.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('user', 'firstName lastName email phone')
      .select('orderNumber orderStatus paymentStatus paymentMethod totalAmount shippingCharge discount finalAmount createdAt items shippingAddress notes estimatedDelivery deliveredAt trackingNumber');

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
    console.error('Get admin orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders'
    });
  }
});

// @route   PUT /api/admin/orders/:orderId/status
// @desc    Update order status
// @access  Private (Admin)
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, trackingNumber, estimatedDelivery, adminNotes } = req.body;

    console.log(`Admin updating order ${orderId} status to: ${orderStatus}`);

    // Validate order status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order status'
      });
    }

    // Find the order first to see current status
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    console.log(`Order ${orderId} current status: ${existingOrder.orderStatus}, updating to: ${orderStatus}`);

    // Find and update the order
    const updateData = { 
      orderStatus,
      updatedAt: new Date()
    };
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery);
    if (adminNotes) updateData.adminNotes = adminNotes;

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email');

    console.log(`Order ${orderId} successfully updated to status: ${order.orderStatus}`);

    res.json({
      status: 'success',
      message: 'Order status updated successfully',
      data: { order }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status'
    });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // User statistics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          newUsersToday: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfDay] }, 1, 0]
            }
          },
          newUsersThisWeek: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfWeek] }, 1, 0]
            }
          },
          newUsersThisMonth: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Recent users
    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt isActive')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // User growth over time (last 7 days)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      status: 'success',
      data: {
        userStats: userStats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          newUsersToday: 0,
          newUsersThisWeek: 0,
          newUsersThisMonth: 0
        },
        recentUsers,
        userGrowth
      }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data with date range filtering
// @access  Admin
router.get('/analytics', async (req, res) => {
  try {
    const { dateRange = '30', filterType = 'revenue' } = req.query;
    
    // Calculate date ranges
    const now = new Date();
    const daysBack = parseInt(dateRange);
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    // Get all admin user IDs to exclude their data
    const adminUsers = await User.find({ role: 'admin' }).select('_id');
    const adminUserIds = adminUsers.map(admin => admin._id);

    // Common match filter for date range
    const dateFilter = {
      user: { $nin: adminUserIds },
      createdAt: { $gte: startDate, $lte: now }
    };

    let trendsData = {};

    if (filterType === 'revenue') {
      // Revenue trends over the date range
      const revenueTrends = await Order.aggregate([
        { $match: { ...dateFilter, paymentStatus: 'completed' } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            revenue: { $sum: '$finalAmount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      trendsData = { revenueTrends };
    } else if (filterType === 'orders') {
      // Order trends over the date range
      const orderTrends = await Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$finalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      trendsData = { orderTrends };
    }

    res.json({
      status: 'success',
      data: {
        dateRange,
        filterType,
        trends: trendsData
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics data'
    });
  }
});

// ==============================================
// ADMIN PROFILE AND SETTINGS ROUTES
// ==============================================

// @route   GET /api/admin/profile
// @desc    Get admin profile information
// @access  Admin
router.get('/profile', async (req, res) => {
  try {
    const admin = await User.findById(req.user._id)
      .select('-password')
      .populate('orders', 'orderNumber totalAmount status createdAt');

    if (!admin) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin profile not found'
      });
    }

    // Get admin statistics
    const adminStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          averageOrderValue: { $avg: '$finalAmount' }
        }
      }
    ]);

    const totalCustomers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalProducts = await Product.countDocuments();

    res.json({
      status: 'success',
      data: {
        admin,
        stats: {
          totalOrders: adminStats[0]?.totalOrders || 0,
          totalRevenue: adminStats[0]?.totalRevenue || 0,
          averageOrderValue: adminStats[0]?.averageOrderValue || 0,
          totalCustomers,
          totalProducts
        }
      }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch admin profile'
    });
  }
});

// @route   PUT /api/admin/profile
// @desc    Update admin profile information
// @access  Admin
router.put('/profile', [
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
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone must be between 10 and 15 characters'),
  body('currentPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Current password must be at least 6 characters'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
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

    const { firstName, lastName, email, phone, currentPassword, newPassword } = req.body;

    // Find the admin
    const admin = await User.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin not found'
      });
    }

    // Check if email is being changed and is already taken
    if (email && email !== admin.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already taken'
        });
      }
    }

    // Handle password change
    if (currentPassword && newPassword) {
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }
      admin.password = newPassword;
    }

    // Update other fields
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (email) admin.email = email;
    if (phone) admin.phone = phone;

    await admin.save();

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        admin: adminResponse
      }
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

// @route   PUT /api/admin/password
// @desc    Update admin password
// @access  Admin
router.put('/password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    // Find the admin
    const admin = await User.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
      status: 'success',
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update admin password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update password'
    });
  }
});

// @route   GET /api/admin/settings
// @desc    Get admin settings
// @access  Admin
router.get('/settings', async (req, res) => {
  try {
    // For now, return default settings
    // In a real application, you might store these in a separate settings collection
    const settings = {
      store: {
        name: process.env.STORE_NAME || 'E-Commerce Store',
        description: process.env.STORE_DESCRIPTION || 'Your one-stop shop for all your needs',
        email: process.env.STORE_EMAIL || 'contact@store.com',
        phone: process.env.STORE_PHONE || '+1234567890',
        address: process.env.STORE_ADDRESS || '123 Store Street, City, Country',
        currency: process.env.STORE_CURRENCY || 'USD',
        timezone: process.env.STORE_TIMEZONE || 'UTC'
      },
      notifications: {
        emailNotifications: true,
        orderNotifications: true,
        lowStockAlerts: true,
        customerRegistrations: false,
        dailyReports: false,
        weeklyReports: true
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordExpiry: 90,
        maxLoginAttempts: 5
      },
      features: {
        enableCoupons: true,
        enableReviews: true,
        enableWishlist: true,
        enableChat: false,
        enableAnalytics: true
      }
    };

    res.json({
      status: 'success',
      data: { settings }
    });

  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch settings'
    });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update admin settings
// @access  Admin
router.put('/settings', [
  body('store.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be between 2 and 100 characters'),
  body('store.email')
    .optional()
    .isEmail()
    .withMessage('Store email must be valid'),
  body('store.phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Store phone must be between 10 and 15 characters')
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

    // In a real application, you would save these to a settings collection
    // For now, we'll just return the updated settings
    const { store, notifications, security, features } = req.body;

    const updatedSettings = {
      store: {
        name: store?.name || process.env.STORE_NAME || 'E-Commerce Store',
        description: store?.description || process.env.STORE_DESCRIPTION || 'Your one-stop shop for all your needs',
        email: store?.email || process.env.STORE_EMAIL || 'contact@store.com',
        phone: store?.phone || process.env.STORE_PHONE || '+1234567890',
        address: store?.address || process.env.STORE_ADDRESS || '123 Store Street, City, Country',
        currency: store?.currency || process.env.STORE_CURRENCY || 'USD',
        timezone: store?.timezone || process.env.STORE_TIMEZONE || 'UTC'
      },
      notifications: {
        emailNotifications: notifications?.emailNotifications ?? true,
        orderNotifications: notifications?.orderNotifications ?? true,
        lowStockAlerts: notifications?.lowStockAlerts ?? true,
        customerRegistrations: notifications?.customerRegistrations ?? false,
        dailyReports: notifications?.dailyReports ?? false,
        weeklyReports: notifications?.weeklyReports ?? true
      },
      security: {
        twoFactorAuth: security?.twoFactorAuth ?? false,
        sessionTimeout: security?.sessionTimeout ?? 30,
        passwordExpiry: security?.passwordExpiry ?? 90,
        maxLoginAttempts: security?.maxLoginAttempts ?? 5
      },
      features: {
        enableCoupons: features?.enableCoupons ?? true,
        enableReviews: features?.enableReviews ?? true,
        enableWishlist: features?.enableWishlist ?? true,
        enableChat: features?.enableChat ?? false,
        enableAnalytics: features?.enableAnalytics ?? true
      }
    };

    // TODO: In production, save these settings to database
    console.log('Settings updated (would be saved to database):', updatedSettings);

    res.json({
      status: 'success',
      message: 'Settings updated successfully',
      data: { settings: updatedSettings }
    });

  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update settings'
    });
  }
});

// @route   PUT /api/admin/settings/store
// @desc    Update store settings specifically
// @access  Admin
router.put('/settings/store', [
  body('storeName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Store name must be between 2 and 100 characters'),
  body('storeEmail')
    .optional()
    .isEmail()
    .withMessage('Store email must be valid'),
  body('storePhone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Store phone must be between 10 and 15 characters')
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

    const {
      storeName,
      storeDescription,
      storeEmail,
      storePhone,
      storeAddress,
      currency,
      timezone,
      language
    } = req.body;

    // In a real application, you would save these to a settings collection
    const updatedStoreSettings = {
      storeName: storeName || process.env.STORE_NAME || 'E-Commerce Store',
      storeDescription: storeDescription || process.env.STORE_DESCRIPTION || 'Your one-stop shop for all your needs',
      storeEmail: storeEmail || process.env.STORE_EMAIL || 'contact@store.com',
      storePhone: storePhone || process.env.STORE_PHONE || '+1234567890',
      storeAddress: storeAddress || process.env.STORE_ADDRESS || '123 Store Street, City, Country',
      currency: currency || process.env.STORE_CURRENCY || 'INR',
      timezone: timezone || process.env.STORE_TIMEZONE || 'Asia/Kolkata',
      language: language || 'en'
    };

    // TODO: In production, save these settings to database
    console.log('Store settings updated (would be saved to database):', updatedStoreSettings);

    res.json({
      status: 'success',
      message: 'Store settings updated successfully',
      data: { storeSettings: updatedStoreSettings }
    });

  } catch (error) {
    console.error('Update store settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update store settings'
    });
  }
});

// @route   PUT /api/admin/settings/notifications
// @desc    Update notification settings specifically
// @access  Admin
router.put('/settings/notifications', async (req, res) => {
  try {
    const {
      emailNotifications,
      orderNotifications,
      lowStockAlerts,
      paymentAlerts,
      customerNotifications,
      promotionalEmails,
      dailyReports,
      weeklyReports
    } = req.body;

    // In a real application, you would save these to a settings collection
    const updatedNotificationSettings = {
      emailNotifications: emailNotifications ?? true,
      orderNotifications: orderNotifications ?? true,
      lowStockAlerts: lowStockAlerts ?? true,
      paymentAlerts: paymentAlerts ?? true,
      customerNotifications: customerNotifications ?? false,
      promotionalEmails: promotionalEmails ?? true,
      dailyReports: dailyReports ?? false,
      weeklyReports: weeklyReports ?? true
    };

    // TODO: In production, save these settings to database
    console.log('Notification settings updated (would be saved to database):', updatedNotificationSettings);

    res.json({
      status: 'success',
      message: 'Notification settings updated successfully',
      data: { notificationSettings: updatedNotificationSettings }
    });

  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update notification settings'
    });
  }
});

// @route   GET /api/admin/activity
// @desc    Get admin activity log
// @access  Admin
router.get('/activity', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get recent orders as activity
    const recentActivity = await Order.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('user', 'firstName lastName email')
      .select('orderNumber orderStatus finalAmount createdAt user');

    // Transform to activity format
    const activities = recentActivity.map(order => ({
      type: 'order',
      action: `Order ${order.orderNumber} - ${order.orderStatus}`,
      description: `${order.user?.firstName} ${order.user?.lastName} placed an order for ₹${order.finalAmount}`,
      timestamp: order.createdAt,
      user: order.user,
      metadata: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.finalAmount,
        status: order.orderStatus
      }
    }));

    // Get total count (for pagination)
    const totalActivities = await Order.countDocuments();

    res.json({
      status: 'success',
      data: {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalActivities / parseInt(limit)),
          total: totalActivities,
          hasNextPage: parseInt(page) < Math.ceil(totalActivities / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get admin activity error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activity log'
    });
  }
});

module.exports = router;
