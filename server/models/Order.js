const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    _id: { type: String }, // Original product ID for reference
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true }
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // Price at time of order
  subtotal: { type: Number, required: true } // quantity * price
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: { type: String }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentMethod: {
    type: String,
    enum: ['cod', 'razorpay', 'upi'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  // Razorpay payment fields
  razorpayOrderId: { type: String }, // Razorpay order ID
  razorpayPaymentId: { type: String }, // Razorpay payment ID
  razorpaySignature: { type: String }, // Razorpay signature for verification
  paymentDetails: {
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    paymentMethod: { type: String },
    transactionId: { type: String },
    paidAt: { type: Date }
  },
  refundDetails: {
    refundId: { type: String },
    refundAmount: { type: Number },
    refundedAt: { type: Date },
    status: { type: String }
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  totalAmount: { type: Number, required: true },
  shippingCharge: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number },
  notes: { type: String },
  trackingNumber: { type: String },
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  adminNotes: { type: String }
}, {
  timestamps: true
});

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `THK${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Calculate final amount
orderSchema.pre('save', function(next) {
  if (this.isNew || this.isModified(['totalAmount', 'shippingCharge', 'discount'])) {
    this.finalAmount = this.totalAmount + this.shippingCharge - this.discount;
  }
  next();
});

// Update delivered date when status changes to delivered
orderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus') && this.orderStatus === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  if (this.isModified('orderStatus') && this.orderStatus === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  next();
});

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
