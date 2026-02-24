const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

const normalizeProduct = (product) => {
  const value = product?.toObject ? product.toObject() : product;
  return {
    ...value,
    mainImage: value?.mainImage || value?.image || value?.images?.[0]?.url || '',
    isFeatured: typeof value?.isFeatured === 'boolean' ? value.isFeatured : Boolean(value?.featured),
    isActive: typeof value?.isActive === 'boolean' ? value.isActive : true
  };
};

// Get all products
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category = '',
      search = '',
      minPrice,
      maxPrice,
      featured = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (featured === 'true') {
      filter.$or = [
        ...(filter.$or || []),
        { featured: true },
        { isFeatured: true }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 12;
    const skip = (pageNumber - 1) * pageSize;

    const [products, totalProducts, categories] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(pageSize),
      Product.countDocuments(filter),
      Product.distinct('category')
    ]);

    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

    res.json({
      status: 'success',
      data: {
        products: products.map(normalizeProduct),
        categories,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalProducts,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);

    res.json({
      status: 'success',
      data: {
        products: products.map(normalizeProduct)
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const products = await Product.find({
      $or: [{ featured: true }, { isFeatured: true }]
    })
      .sort({ createdAt: -1 })
      .limit(8);

    res.json({
      status: 'success',
      data: {
        products: products.map(normalizeProduct)
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    })
      .sort({ createdAt: -1 })
      .limit(4);

    res.json({
      status: 'success',
      data: {
        product: normalizeProduct(product),
        relatedProducts: relatedProducts.map(normalizeProduct)
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Create product (admin only - simplified)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      mainImage,
      stock = 0,
      discount = 0,
      featured,
      isFeatured
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'name, description, price, and category are required'
      });
    }
    
    const product = new Product({
      name,
      description,
      price: Number(price),
      category,
      image: mainImage || image || undefined,
      stock: Number(stock),
      discount: Number(discount),
      featured: isFeatured === true || isFeatured === 'true' || featured === true || featured === 'true'
    });
    
    await product.save();

    res.status(201).json({
      status: 'success',
      message: 'Product created',
      product: normalizeProduct(product)
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.mainImage && !updateData.image) {
      updateData.image = updateData.mainImage;
    }

    if (updateData.isFeatured !== undefined) {
      updateData.featured = updateData.isFeatured === true || updateData.isFeatured === 'true';
    }

    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);
    if (updateData.discount !== undefined) updateData.discount = Number(updateData.discount);

    delete updateData.mainImage;
    delete updateData.isFeatured;
    delete updateData.isActive;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    
    res.json({
      status: 'success',
      message: 'Product updated',
      product: normalizeProduct(product)
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    
    res.json({ status: 'success', message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;