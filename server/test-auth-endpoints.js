const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testRegistration() {
    console.log('🔄 Testing User Registration...');
    
    const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: `testuser${Date.now()}@example.com`, // Unique email
        password: 'password123',
        phone: '1234567890'
    };

    try {
        const response = await axios.post(`${API_BASE}/api/auth/register`, userData);
        console.log('✅ REGISTRATION SUCCESS:');
        console.log('User:', response.data.user);
        console.log('Token:', response.data.token ? 'Generated' : 'Missing');
        return response.data;
    } catch (error) {
        console.log('❌ REGISTRATION FAILED:');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data?.error || error.message);
        return null;
    }
}

async function testLogin() {
    console.log('\n🔄 Testing User Login...');
    
    const loginData = {
        email: 'johndoe@test.com',
        password: 'password123'
    };

    try {
        const response = await axios.post(`${API_BASE}/api/auth/login`, loginData);
        console.log('✅ LOGIN SUCCESS:');
        console.log('User:', response.data.user);
        console.log('Token:', response.data.token ? 'Generated' : 'Missing');
        return response.data;
    } catch (error) {
        console.log('❌ LOGIN FAILED:');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data?.error || error.message);
        return null;
    }
}

async function testProfile(token) {
    console.log('\n🔄 Testing Profile Access...');
    
    try {
        const response = await axios.get(`${API_BASE}/api/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ PROFILE ACCESS SUCCESS:');
        console.log('Profile:', response.data.user);
        return response.data;
    } catch (error) {
        console.log('❌ PROFILE ACCESS FAILED:');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data?.error || error.message);
        return null;
    }
}

async function testServerConnection() {
    console.log('🔄 Testing Server Connection...');
    
    try {
        const response = await axios.get(`${API_BASE}/api/health`);
        console.log('✅ SERVER CONNECTION SUCCESS:');
        console.log('Response:', response.data);
        return true;
    } catch (error) {
        console.log('❌ SERVER CONNECTION FAILED:');
        console.log('Error:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Authentication Tests...\n');
    
    // Test server connection first
    const serverOnline = await testServerConnection();
    if (!serverOnline) {
        console.log('\n❌ Server is not responding. Please make sure server is running on port 3000');
        return;
    }

    // Test registration
    const registrationResult = await testRegistration();
    
    // Test login (try with a known user first)
    const loginResult = await testLogin();
    
    // If we have a token from either registration or login, test profile
    const token = registrationResult?.token || loginResult?.token;
    if (token) {
        await testProfile(token);
    }

    console.log('\n🏁 Tests completed!');
}

runTests();