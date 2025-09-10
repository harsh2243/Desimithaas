const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Order = require('../models/Order');
const { createOrder, verifyPaymentSignature, retrievePayment } = require('../services/razorpayService');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Payment routes working' });
});

// Create Razorpay order
router.post('/create-razorpay-order', authenticateToken, async (req, res) => {
  try {
    console.log('=== Create Razorpay Order Request ===');
    console.log('User:', req.user);
    console.log('Request Body:', req.body);
    
    const { amount, currency = 'INR', receipt, notes } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Create Razorpay order
    const shortUserId = userId.substring(userId.length - 8); // Last 8 chars of user ID
    const shortTimestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const shortReceipt = `ord_${shortUserId}_${shortTimestamp}`.substring(0, 40); // Ensure max 40 chars
    
    const razorpayOrder = await createOrder(
      amount,
      currency,
      receipt || shortReceipt,
      { userId, ...notes }
    );

    res.json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      }
    });

  } catch (error) {
    console.error('Create Razorpay order error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay order',
      error: error.message
    });
  }
});

// Verify Razorpay payment and create order
router.post('/verify-razorpay-payment', authenticateToken, async (req, res) => {
  try {
    console.log('=== Verify Razorpay Payment Request ===');
    console.log('User:', req.user);
    console.log('Request Body:', req.body);
    
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      shippingAddress,
      totalAmount,
      shippingCharge,
      finalAmount
    } = req.body;
    
    const userId = req.user.id;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay payment details are required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment details from Razorpay
    const paymentDetails = await retrievePayment(razorpay_payment_id);

    // Create order in database
    const orderData = {
      user: userId,
      items,
      shippingAddress,
      paymentMethod: 'razorpay',
      paymentStatus: paymentDetails.status === 'captured' ? 'paid' : 'pending',
      orderStatus: 'confirmed',
      totalAmount,
      shippingCharge: shippingCharge || 0,
      finalAmount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    };

    const order = new Order(orderData);
    await order.save();

    res.json({
      success: true,
      message: 'Payment verified and order created successfully',
      data: { order }
    });

  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment and create order'
    });
  }
});

// Create Cash on Delivery order (working route)
router.post('/cod-order', authenticateToken, async (req, res) => {
  try {
    console.log('=== COD Order Request ===');
    console.log('User:', req.user);
    console.log('Request Body:', req.body);
    
    const { items, shippingAddress, totalAmount, shippingCharge, finalAmount } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    if (!totalAmount || !finalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Total amount and final amount are required'
      });
    }

    const orderData = {
      user: userId,
      items,
      shippingAddress,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      totalAmount,
      shippingCharge: shippingCharge || 0,
      finalAmount
    };

    const order = new Order(orderData);
    await order.save();

    res.json({
      success: true,
      message: 'Cash on Delivery order created successfully',
      data: { order }
    });

  } catch (error) {
    console.error('COD order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create COD order'
    });
  }
});

module.exports = router;