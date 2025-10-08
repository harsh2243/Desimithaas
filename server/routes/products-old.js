const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all active products for frontend
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category = '',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice = 0,
      maxPrice = 10000,
      featured = ''
    } = req.query;

    // Build filter for active products only
    const filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (featured === 'true') {
      filter.isFeatured = true;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get products with computed fields
    const products = await Product.aggregate([
      { $match: filter },
      {
        $addFields: {
          discountedPrice: {
            $cond: {
              if: { $gt: ['$discount', 0] },
              then: { $subtract: ['$price', { $multiply: ['$price', { $divide: ['$discount', 100] }] }] },
              else: '$price'
            }
          },
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
          }
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);
    
    // Get total count
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));
    
    // Get categories for filtering
    const categories = await Product.distinct('category', { isActive: true });
    
    // Update view counts for products
    if (products.length > 0) {
      const productIds = products.map(p => p._id);
      await Product.updateMany(
        { _id: { $in: productIds } },
        { $inc: { views: 1 } }
      );
    }
    
    res.json({
      status: 'success',
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        categories
      }
    });
    
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

// @route   GET /api/products/:productId
// @desc    Get single product details
// @access  Public
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findOne({ 
      _id: productId, 
      isActive: true 
    });
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }
    
    // Update view count
    await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });
    
    // Get related products
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: productId },
      isActive: true
    })
    .limit(4)
    .select('name price discount mainImage slug ratings');
    
    // Add computed fields
    const productWithComputedFields = {
      ...product.toObject(),
      discountedPrice: product.discount > 0 
        ? product.price - (product.price * product.discount / 100)
        : product.price,
      stockStatus: product.stock === 0 
        ? 'out-of-stock' 
        : product.stock <= 10 
          ? 'low-stock' 
          : 'in-stock'
    };
    
    res.json({
      status: 'success',
      data: {
        product: productWithComputedFields,
        relatedProducts
      }
    });
    
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product details'
    });
  }
});

// @route   GET /api/products/featured/list
// @desc    Get featured products for homepage
// @access  Public
router.get('/featured/list', async (req, res) => {
  try {
    const featuredProducts = await Product.find({
      isActive: true,
      isFeatured: true
    })
    .sort({ soldCount: -1, 'ratings.average': -1 })
    .limit(8)
    .select('name price discount mainImage slug ratings soldCount');
    
    // Add computed fields
    const productsWithDiscount = featuredProducts.map(product => ({
      ...product.toObject(),
      discountedPrice: product.discount > 0 
        ? product.price - (product.price * product.discount / 100)
        : product.price
    }));
    
    res.json({
      status: 'success',
      data: {
        products: productsWithDiscount
      }
    });
    
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch featured products'
    });
  }
});

// @route   GET /api/products/categories/list
// @desc    Get all product categories
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      status: 'success',
      data: {
        categories
      }
    });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories'
    });
  }
});

module.exports = router;
