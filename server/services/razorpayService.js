const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');

// Load environment variables if not already loaded
if (!process.env.RAZORPAY_KEY_ID) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

console.log('Razorpay environment check:', {
  key_id: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not set',
  key_secret: process.env.RAZORPAY_SECRET_KEY ? 'Set' : 'Not set'
});

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

/**
 * Create a Razorpay order
 */
const createOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in smallest currency unit (paise for INR)
      currency: currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes,
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create Razorpay order');
  }
};

/**
 * Verify Razorpay payment signature
 */
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    return expectedSignature === razorpaySignature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

/**
 * Retrieve a Razorpay order
 */
const retrieveOrder = async (orderId) => {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Error retrieving Razorpay order:', error);
    throw new Error('Failed to retrieve Razorpay order');
  }
};

/**
 * Retrieve a Razorpay payment
 */
const retrievePayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error retrieving Razorpay payment:', error);
    throw new Error('Failed to retrieve Razorpay payment');
  }
};

/**
 * Capture a payment (for authorized payments)
 */
const capturePayment = async (paymentId, amount) => {
  try {
    const payment = await razorpay.payments.capture(paymentId, amount * 100);
    return payment;
  } catch (error) {
    console.error('Error capturing payment:', error);
    throw new Error('Failed to capture payment');
  }
};

/**
 * Refund a payment
 */
const refundPayment = async (paymentId, amount, notes = {}) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? amount * 100 : undefined, // Full refund if amount not specified
      notes: notes,
    });
    return refund;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new Error('Failed to process refund');
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature,
  retrieveOrder,
  retrievePayment,
  capturePayment,
  refundPayment,
};
