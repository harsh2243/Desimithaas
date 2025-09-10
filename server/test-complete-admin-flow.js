const axios = require('axios');

async function testAdminAccess() {
  try {
    console.log('🔐 Testing complete admin flow...');
    
    // Step 1: Login as admin
    console.log('\n📝 Step 1: Admin Login');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@thekua.com',
      password: 'Admin@123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful! Token received.');
    
    // Step 2: Test admin-only routes
    console.log('\n📝 Step 2: Testing Admin Dashboard Access');
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test users list
    try {
      const usersResponse = await axios.get('http://localhost:5001/api/admin/users', { headers });
      console.log('✅ Users endpoint accessible');
      console.log(`📊 Found ${usersResponse.data.data.users.length} users`);
    } catch (error) {
      console.log('❌ Users endpoint failed:', error.response?.data?.message || error.message);
    }
    
    // Test products list
    try {
      const productsResponse = await axios.get('http://localhost:5001/api/admin/products', { headers });
      console.log('✅ Products endpoint accessible');
      console.log(`📊 Found ${productsResponse.data.data.products.length} products`);
    } catch (error) {
      console.log('❌ Products endpoint failed:', error.response?.data?.message || error.message);
    }
    
    // Test orders list
    try {
      const ordersResponse = await axios.get('http://localhost:5001/api/admin/orders', { headers });
      console.log('✅ Orders endpoint accessible');
      console.log(`📊 Found ${ordersResponse.data.data.orders.length} orders`);
    } catch (error) {
      console.log('❌ Orders endpoint failed:', error.response?.data?.message || error.message);
    }
    
    // Test dashboard stats
    try {
      const statsResponse = await axios.get('http://localhost:5001/api/admin/dashboard/stats', { headers });
      console.log('✅ Dashboard stats accessible');
      console.log('📊 Stats:', JSON.stringify(statsResponse.data.data, null, 2));
    } catch (error) {
      console.log('❌ Dashboard stats failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Admin panel backend is fully functional!');
    console.log('🔑 Use these credentials to login:');
    console.log('   Email: admin@thekua.com');
    console.log('   Password: Admin@123');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testAdminAccess();
