const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testAuth() {
  console.log('🧪 Testing Authentication...\n');

  // Test 1: Server connectivity
  try {
    const response = await axios.get(`${API_BASE}/api/health`);
    console.log('✅ Server Health Check:', response.data);
  } catch (error) {
    console.log('❌ Server Health Check Failed:', error.message);
  }

  // Test 2: User Registration
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser' + Date.now() + '@example.com',
    password: 'password123',
    phone: '1234567890'
  };

  try {
    console.log('\n📝 Testing Registration...');
    console.log('Request data:', testUser);
    
    const response = await axios.post(`${API_BASE}/api/auth/register`, testUser);
    console.log('✅ Registration Success:', response.data);
    
    // Test 3: User Login with the same credentials
    console.log('\n🔑 Testing Login...');
    const loginData = {
      email: testUser.email,
      password: testUser.password
    };
    console.log('Login data:', loginData);
    
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, loginData);
    console.log('✅ Login Success:', loginResponse.data);
    
    // Test 4: Profile access with token
    console.log('\n👤 Testing Profile Access...');
    const token = loginResponse.data.token;
    const profileResponse = await axios.get(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile Access Success:', profileResponse.data);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

testAuth().catch(console.error);