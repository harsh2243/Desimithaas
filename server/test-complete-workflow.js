const axios = require('axios');

async function testAllAPIs() {
  try {
    console.log('🧪 Testing all API endpoints and payment methods...\n');
    
    const baseURL = 'http://localhost:5001';
    let authToken = null;

    // Test 1: Login
    console.log('1️⃣ Testing Login...');
    try {
      const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
        email: 'test@test.com',
        password: 'test123'
      });
      
      if (loginResponse.data.status === 'success') {
        authToken = loginResponse.data.data.token;
        console.log('✅ Login successful');
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
        return;
      }
    } catch (error) {
      console.log('❌ Login error:', error.response?.data?.message || error.message);
      return;
    }

    // Test 2: Profile endpoint
    console.log('\n2️⃣ Testing Profile endpoint...');
    try {
      const profileResponse = await axios.get(`${baseURL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (profileResponse.data.status === 'success') {
        console.log('✅ Profile endpoint working');
      } else {
        console.log('❌ Profile failed:', profileResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Profile error:', error.response?.data?.message || error.message);
    }

    // Test 3: Orders endpoint
    console.log('\n3️⃣ Testing Orders endpoint...');
    try {
      const ordersResponse = await axios.get(`${baseURL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (ordersResponse.data.status === 'success') {
        console.log('✅ Orders endpoint working');
        console.log(`   Found ${ordersResponse.data.data.orders.length} orders`);
      } else {
        console.log('❌ Orders failed:', ordersResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Orders error:', error.response?.data?.message || error.message);
    }

    // Test 4: COD Order Creation
    console.log('\n4️⃣ Testing COD Order Creation...');
    try {
      const codOrderData = {
        items: [{
          product: {
            _id: '648c15b2e4b0d7f8a9c12345',
            name: 'Traditional Thekua',
            price: 299,
            image: '/thekua-placeholder.svg',
            description: 'Authentic traditional thekua',
            category: 'Traditional Sweets'
          },
          quantity: 2,
          price: 299
        }],
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890',
          email: 'test@test.com',
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          postalCode: '123456'
        },
        paymentMethod: 'cod',
        totalAmount: 648,
        subtotal: 598,
        shippingCost: 50
      };

      const codResponse = await axios.post(`${baseURL}/api/orders`, codOrderData, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (codResponse.data.status === 'success') {
        console.log('✅ COD order creation successful');
        console.log(`   Order ID: ${codResponse.data.data.order.orderNumber}`);
      } else {
        console.log('❌ COD order failed:', codResponse.data.message);
      }
    } catch (error) {
      console.log('❌ COD order error:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('   Validation errors:', error.response.data.errors);
      }
    }

    // Test 5: UPI Order Creation
    console.log('\n5️⃣ Testing UPI Order Creation...');
    try {
      const upiOrderData = {
        items: [{
          product: {
            _id: '648c15b2e4b0d7f8a9c12345',
            name: 'Traditional Thekua',
            price: 299,
            image: '/thekua-placeholder.svg',
            description: 'Authentic traditional thekua',
            category: 'Traditional Sweets'
          },
          quantity: 1,
          price: 299
        }],
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          phone: '1234567890',
          email: 'test@test.com',
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          postalCode: '123456'
        },
        paymentMethod: 'upi',
        paymentDetails: {
          paymentId: `upi_${Date.now()}`,
          method: 'UPI'
        },
        totalAmount: 349,
        subtotal: 299,
        shippingCost: 50
      };

      const upiResponse = await axios.post(`${baseURL}/api/orders`, upiOrderData, {
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (upiResponse.data.status === 'success') {
        console.log('✅ UPI order creation successful');
        console.log(`   Order ID: ${upiResponse.data.data.order.orderNumber}`);
      } else {
        console.log('❌ UPI order failed:', upiResponse.data.message);
      }
    } catch (error) {
      console.log('❌ UPI order error:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('   Validation errors:', error.response.data.errors);
      }
    }

    console.log('\n🎉 All API tests completed!');
    console.log('\n📝 Summary:');
    console.log('- Login endpoint: Working');
    console.log('- Profile endpoint: Fixed (added /auth/profile route)');
    console.log('- Orders endpoint: Should be working with authentication');
    console.log('- COD payments: Should work with proper product data');
    console.log('- UPI payments: Should work with flexible validation');
    console.log('\n💡 Next steps:');
    console.log('1. Test login on frontend: http://localhost:3001/auth/login');
    console.log('2. Use credentials: test@test.com / test123');
    console.log('3. Try Buy Now button after login');
    console.log('4. Test all payment methods');

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Check if axios is available
try {
  testAllAPIs();
} catch (error) {
  console.log('❌ Axios not available. Install with: npm install axios');
  console.log('Or test manually using the browser at http://localhost:3001');
}
