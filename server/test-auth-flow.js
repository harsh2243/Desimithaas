const axios = require('axios');

async function testAuthFlow() {
  try {
    console.log('Testing authentication flow...\n');
    
    // Test 1: Login with test user
    console.log('1. Attempting login...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'test@test.com',  
      password: 'test123'
    });
    
    if (loginResponse.data.status === 'success') {
      console.log('✅ Login successful');
      console.log('Token received:', loginResponse.data.data.token.substring(0, 50) + '...');
      
      const token = loginResponse.data.data.token;
      
      // Test 2: Get user profile
      console.log('\n2. Testing profile access...');
      const profileResponse = await axios.get('http://localhost:5001/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (profileResponse.data.status === 'success') {
        console.log('✅ Profile access successful');
        console.log('User:', profileResponse.data.data.user.email);
        
        // Test 3: Get orders
        console.log('\n3. Testing orders access...');
        const ordersResponse = await axios.get('http://localhost:5001/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (ordersResponse.data.status === 'success') {
          console.log('✅ Orders access successful');
          console.log('Orders found:', ordersResponse.data.data.orders.length);
        } else {
          console.log('❌ Orders access failed:', ordersResponse.data.message);
        }
      } else {
        console.log('❌ Profile access failed:', profileResponse.data.message);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
  }
}

testAuthFlow();
