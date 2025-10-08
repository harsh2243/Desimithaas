const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Thekua', 'Sweets', 'Snacks', 'Traditional', 'Festival Special', 'Gift Boxes', 'Organic', 'Sugar-Free'],
    default: 'Thekua'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  images: [{
    url: String,
    alt: String
  }],
  mainImage: {
    type: String,
    required: false
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['gm', 'kg', 'piece'],
      default: 'gm'
    }
  },
  ingredients: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  soldCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  seoTitle: String,
  seoDescription: String,
  slug: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ 'ratings.average': -1 });

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discount > 0) {
    return this.price - (this.price * this.discount / 100);
  }
  return this.price;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= 10) return 'low-stock';
  return 'in-stock';
});

// Create slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Create default products
productSchema.statics.createDefaultProducts = async function() {
  try {
    const count = await this.countDocuments();
    if (count === 0) {
      const defaultProducts = [
        {
          name: 'Traditional Thekua',
          description: 'Authentic Bihar-style thekua made with jaggery and wheat flour. A traditional sweet snack perfect for festivals and special occasions.',
          category: 'Thekua',
          price: 120,
          originalPrice: 150,
          discount: 20,
          mainImage: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          stock: 50,
          weight: { value: 250, unit: 'gm' },
          ingredients: ['Wheat Flour', 'Jaggery', 'Ghee', 'Coconut', 'Cardamom'],
          tags: ['traditional', 'festival', 'sweet', 'bihar'],
          isActive: true,
          isFeatured: true,
          ratings: { average: 4.5, count: 15 },
          soldCount: 25
        },
        {
          name: 'Coconut Thekua',
          description: 'Delicious thekua with fresh coconut and aromatic spices. Made with traditional recipe passed down through generations.',
          category: 'Thekua',
          price: 140,
          originalPrice: 160,
          discount: 12,
          mainImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          stock: 30,
          weight: { value: 300, unit: 'gm' },
          ingredients: ['Wheat Flour', 'Coconut', 'Jaggery', 'Ghee', 'Fennel Seeds'],
          tags: ['coconut', 'traditional', 'festival'],
          isActive: true,
          isFeatured: false,
          ratings: { average: 4.3, count: 8 },
          soldCount: 12
        },
        {
          name: 'Gur Thekua (Jaggery Special)',
          description: 'Premium thekua made with pure organic jaggery. Rich in taste and nutritional value.',
          category: 'Thekua',
          price: 160,
          originalPrice: 180,
          discount: 11,
          mainImage: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          stock: 25,
          weight: { value: 400, unit: 'gm' },
          ingredients: ['Wheat Flour', 'Organic Jaggery', 'Pure Ghee', 'Dry Fruits'],
          tags: ['premium', 'organic', 'healthy'],
          isActive: true,
          isFeatured: true,
          ratings: { average: 4.7, count: 20 },
          soldCount: 35
        },
        {
          name: 'Mini Thekua Bites',
          description: 'Bite-sized thekua perfect for kids and snacking. Same great taste in convenient small portions.',
          category: 'Snacks',
          price: 80,
          originalPrice: 100,
          discount: 20,
          mainImage: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
          stock: 40,
          weight: { value: 150, unit: 'gm' },
          ingredients: ['Wheat Flour', 'Jaggery', 'Ghee', 'Cardamom'],
          tags: ['kids', 'snack', 'mini', 'convenient'],
          isActive: true,
          isFeatured: false,
          ratings: { average: 4.2, count: 12 },
          soldCount: 18
        }
      ];

      await this.insertMany(defaultProducts);
      console.log('✅ Default products created');
    }
  } catch (error) {
    console.error('❌ Error creating default products:', error);
  }
};

module.exports = mongoose.model('Product', productSchema);
