const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const stripeService = require('../services/stripeService');
const router = express.Router();

// Create a payment intent for Stripe payment
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    // Manual validation
    const { amount, orderId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const userId = req.user.id;

    // Verify the order belongs to the user
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order amount matches
    if (order.finalAmount !== amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch'
      });
    }

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent(
      amount,
      'inr',
      {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: userId
      }
    );

    // Update order with payment intent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment intent'
    });
  }
});

// Confirm payment and update order status
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    const userId = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    // Find the order
    const order = await Order.findOne({ 
      paymentIntentId: paymentIntentId,
      user: userId 
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order based on payment status
    if (paymentIntent.status === 'succeeded') {
      order.paymentStatus = 'completed';
      order.orderStatus = 'confirmed';
      order.paymentDetails = {
        paymentIntentId: paymentIntent.id,
        paymentMethod: 'online',
        transactionId: paymentIntent.charges?.data[0]?.id || null,
        paidAt: new Date()
      };
    } else if (paymentIntent.status === 'requires_action') {
      order.paymentStatus = 'pending';
    } else {
      order.paymentStatus = 'failed';
    }

    await order.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        order: {
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          orderStatus: order.orderStatus
        },
        paymentStatus: paymentIntent.status
      }
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming payment'
    });
  }
});

// Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = require('stripe').webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    const result = stripeService.handleWebhookEvent(event);

    if (result.type === 'payment_succeeded') {
      const paymentIntent = result.data;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'completed',
          orderStatus: 'confirmed',
          'paymentDetails.paidAt': new Date(),
          'paymentDetails.transactionId': paymentIntent.charges?.data[0]?.id
        });
      }
    } else if (result.type === 'payment_failed') {
      const paymentIntent = result.data;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'failed'
        });
      }
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

module.exports = router;
