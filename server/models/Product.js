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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: '/images/default-product.jpg'
  },
  mainImage: {
    type: String,
    default: ''
  },
  images: [{
    url: String,
    alt: String
  }],
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  soldCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  weight: {
    value: { type: Number, default: 250 },
    unit: { type: String, default: 'g' }
  }
}, {
  timestamps: true
});

productSchema.pre('save', function(next) {
  if (!this.mainImage && this.image) {
    this.mainImage = this.image;
  }

  if (!this.image && this.mainImage) {
    this.image = this.mainImage;
  }

  this.featured = this.isFeatured;
  next();
});

productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() || {};

  if (update.mainImage && !update.image) {
    update.image = update.mainImage;
  }

  if (update.image && !update.mainImage) {
    update.mainImage = update.image;
  }

  if (update.isFeatured !== undefined) {
    update.featured = update.isFeatured;
  }

  this.setUpdate(update);
  next();
});

module.exports = mongoose.model('Product', productSchema);