const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [20, 'Coupon code cannot exceed 20 characters']
  },
  description: {
    type: String,
    required: [true, 'Coupon description is required'],
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Coupon type is required']
  },
  discount: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount cannot be negative']
  },
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  maxDiscountAmount: {
    type: Number,
    default: null,
    min: [0, 'Maximum discount amount cannot be negative']
  },
  usageLimit: {
    type: Number,
    default: null,
    min: [1, 'Usage limit must be at least 1']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Coupon end date is required'],
    validate: {
      validator: function(endDate) {
        return endDate > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  applicableCategories: [{
    type: String,
    trim: true
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  isFirstOrderOnly: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

// Virtual for checking if coupon is currently valid
couponSchema.virtual('isCurrentlyValid').get(function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
});

// Method to check if coupon can be applied to an order
couponSchema.methods.canBeAppliedTo = function(orderAmount, categories = [], productIds = [], isFirstOrder = false) {
  // Check if coupon is currently valid
  if (!this.isCurrentlyValid) {
    return { valid: false, message: 'Coupon has expired or is inactive' };
  }

  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    return { 
      valid: false, 
      message: `Minimum order amount ₹${this.minOrderAmount} required` 
    };
  }

  // Check if it's first order only coupon
  if (this.isFirstOrderOnly && !isFirstOrder) {
    return { 
      valid: false, 
      message: 'This coupon is valid only for first orders' 
    };
  }

  // Check category restrictions
  if (this.applicableCategories.length > 0) {
    const hasValidCategory = categories.some(category => 
      this.applicableCategories.includes(category)
    );
    if (!hasValidCategory) {
      return { 
        valid: false, 
        message: 'Coupon not applicable to items in your cart' 
      };
    }
  }

  // Check product restrictions
  if (this.applicableProducts.length > 0) {
    const hasValidProduct = productIds.some(productId => 
      this.applicableProducts.includes(productId)
    );
    if (!hasValidProduct) {
      return { 
        valid: false, 
        message: 'Coupon not applicable to items in your cart' 
      };
    }
  }

  return { valid: true, message: 'Coupon is valid' };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  let discountAmount = 0;
  
  if (this.type === 'percentage') {
    discountAmount = Math.round((orderAmount * this.discount) / 100);
  } else {
    discountAmount = this.discount;
  }

  // Apply maximum discount limit if set
  if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
    discountAmount = this.maxDiscountAmount;
  }

  return Math.min(discountAmount, orderAmount); // Don't exceed order amount
};

// Method to increment usage count
couponSchema.methods.incrementUsage = async function() {
  this.usedCount += 1;
  await this.save();
};

module.exports = mongoose.model('Coupon', couponSchema);
