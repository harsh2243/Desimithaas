// Simple test for auth endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAuth() {
  try {
    console.log('Testing Auth Endpoints...\n');

    // Test Health Check
    console.log('1. Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', health.data);

    // Test Registration
    console.log('\n2. Testing Registration...');
    const registerData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123'
    };

    try {
      const register = await axios.post(`${BASE_URL}/auth/register`, registerData);
      console.log('✅ Registration Success:', register.data);
      
      // Test Login with the same credentials
      console.log('\n3. Testing Login...');
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const login = await axios.post(`${BASE_URL}/auth/login`, loginData);
      console.log('✅ Login Success:', login.data);
      
    } catch (regError) {
      if (regError.response && regError.response.status === 400) {
        console.log('ℹ️ User already exists, testing login...');
        
        // Test Login
        console.log('\n3. Testing Login...');
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };
        
        const login = await axios.post(`${BASE_URL}/auth/login`, loginData);
        console.log('✅ Login Success:', login.data);
      } else {
        throw regError;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAuth();