const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login API...');
    
    const loginData = {
      email: 'testadmin@example.com',
      password: 'TestAdmin123'
    };
    
    console.log('📧 Login credentials:', loginData);
    
    const response = await axios.post('http://localhost:5001/api/auth/login', loginData);
    
    console.log('✅ Login successful!');
    console.log('👤 User data:', JSON.stringify(response.data.data.user, null, 2));
    console.log('🔑 Token received:', response.data.data.accessToken ? 'Yes' : 'No');
    
    if (response.data.data.user.role === 'admin') {
      console.log('🛡️  ADMIN STATUS CONFIRMED!');
    } else {
      console.log('⚠️  User role is:', response.data.data.user.role);
    }
    
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message);
      console.error('Full response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Also test with the original admin
async function testOriginalAdmin() {
  try {
    console.log('\n🔍 Testing original admin login...');
    
    const loginData = {
      email: 'newadmin@thekua.com',
      password: 'NewAdmin123'
    };
    
    console.log('📧 Login credentials:', loginData);
    
    const response = await axios.post('http://localhost:5001/api/auth/login', loginData);
    
    console.log('✅ Login successful!');
    console.log('👤 User data:', JSON.stringify(response.data.data.user, null, 2));
    console.log('🔑 Token received:', response.data.data.accessToken ? 'Yes' : 'No');
    
    if (response.data.data.user.role === 'admin') {
      console.log('🛡️  ADMIN STATUS CONFIRMED!');
    } else {
      console.log('⚠️  User role is:', response.data.data.user.role);
    }
    
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function runTests() {
  await testAdminLogin();
  await testOriginalAdmin();
}

runTests();
