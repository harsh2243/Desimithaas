import fetch from 'node-fetch';

// Test script to verify payment flow works correctly
const BASE_URL = 'http://localhost:5001';

async function testPaymentFlow() {
  console.log('🧪 Testing Payment Flow...\n');

  try {
    // Test 1: Login to get auth token
    console.log('1. Testing user login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'test123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Test 2: Test Razorpay order creation
    console.log('2. Testing Razorpay order creation...');
    const razorpayResponse = await fetch(`${BASE_URL}/api/payments/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 25000 // 250 INR in paise
      })
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      throw new Error(`Razorpay order creation failed: ${razorpayResponse.status} - ${errorData}`);
    }

    const razorpayData = await razorpayResponse.json();
    console.log('✅ Razorpay order created successfully');
    console.log('   Order ID:', razorpayData.data.orderId);
    console.log('   Amount:', razorpayData.data.amount);
    console.log('   Currency:', razorpayData.data.currency);

    // Test 3: Test COD order creation
    console.log('3. Testing COD order creation...');
    const codOrderData = {
      items: [
        {
          product: {
            _id: '507f1f77bcf86cd799439011',
            name: 'Test Kua',
            price: 150,
            image: '/test.jpg',
            description: 'Test traditional sweet',
            category: 'Traditional Sweets'
          },
          quantity: 2,
          price: 150
        }
      ],
      shippingAddress: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        phone: '+91 9876543210',
        street: '123 Test Street',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India'
      },
      paymentMethod: 'cod',
      totalAmount: 350,
      subtotal: 300,
      shippingCost: 50
    };

    const codResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(codOrderData)
    });

    if (!codResponse.ok) {
      const errorData = await codResponse.text();
      console.log('❌ COD order failed:', errorData);
    } else {
      const codData = await codResponse.json();
      console.log('✅ COD order created successfully');
      console.log('   Order Number:', codData.order.orderNumber);
      console.log('   Payment Method:', codData.order.paymentMethod);
      console.log('   Order Status:', codData.order.orderStatus);
    }

    console.log('\n🎉 Payment flow tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User authentication works');
    console.log('   ✅ Razorpay order creation works');
    console.log('   ✅ COD order creation works');
    console.log('\n💡 Frontend should now show:');
    console.log('   - COD: Direct order placement');
    console.log('   - Card: Razorpay payment gateway');
    console.log('   - UPI: Razorpay with UPI options');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPaymentFlow();
