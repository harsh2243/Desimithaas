const mongoose = require('mongoose');
const Order = require('./models/Order');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website';

async function testOrderStatusUpdate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test order
    console.log('\n📋 Finding existing orders...');
    const orders = await Order.find({}).populate('user', 'firstName lastName email').limit(5);
    
    if (orders.length === 0) {
      console.log('❌ No orders found. Creating a test order first...');
      
      // Find a user to create an order for
      const user = await User.findOne({ role: 'user' });
      if (!user) {
        console.log('❌ No user found to create order for');
        return;
      }

      // Create a test order
      const testOrder = new Order({
        user: user._id,
        orderNumber: `TEST-${Date.now()}`,
        orderStatus: 'pending',
        items: [{
          product: null, // We'll use a simple test item
          name: 'Test Product',
          price: 100,
          quantity: 1
        }],
        shippingAddress: {
          fullName: 'Test User',
          address: 'Test Address',
          city: 'Test City',
          state: 'Test State',
          zipCode: '123456',
          country: 'India'
        },
        subtotal: 100,
        shippingCost: 0,
        finalAmount: 100,
        paymentMethod: 'cod',
        paymentStatus: 'pending'
      });

      await testOrder.save();
      console.log(`✅ Created test order: ${testOrder.orderNumber}`);
      orders.push(testOrder);
    }

    const testOrder = orders[0];
    console.log(`\n🔄 Testing status update for order: ${testOrder.orderNumber}`);
    console.log(`Current status: ${testOrder.orderStatus}`);

    // Test status updates
    const statusSequence = ['pending', 'confirmed', 'shipped', 'delivered'];
    let currentStatusIndex = statusSequence.indexOf(testOrder.orderStatus);
    
    if (currentStatusIndex === -1) currentStatusIndex = 0;
    
    const nextStatus = statusSequence[Math.min(currentStatusIndex + 1, statusSequence.length - 1)];
    
    console.log(`Updating status from ${testOrder.orderStatus} to ${nextStatus}...`);

    // Update the order status
    const updatedOrder = await Order.findByIdAndUpdate(
      testOrder._id,
      { 
        orderStatus: nextStatus,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email');

    console.log(`✅ Order status updated successfully!`);
    console.log(`Order ID: ${updatedOrder._id}`);
    console.log(`Order Number: ${updatedOrder.orderNumber}`);
    console.log(`New Status: ${updatedOrder.orderStatus}`);
    console.log(`Updated At: ${updatedOrder.updatedAt}`);
    
    // Verify the update by fetching the order again
    const verifyOrder = await Order.findById(testOrder._id);
    console.log(`\n🔍 Verification - Order status in DB: ${verifyOrder.orderStatus}`);
    
    console.log('\n✅ Order status update test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testOrderStatusUpdate();
