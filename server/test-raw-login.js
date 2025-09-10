const axios = require('axios');

async function testRawLogin() {
  try {
    console.log('🔍 Testing RAW login API (no validation)...');
    
    // Test by directly posting to the endpoint
    const loginData = {
      email: 'testadmin@example.com',
      password: 'TestAdmin123'
    };
    
    console.log('📧 Raw login data:', loginData);
    
    // Try with fetch instead of axios to see if that makes a difference
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    const responseData = await response.text();
    console.log('📄 Raw response text:', responseData);
    
    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(responseData);
      console.log('📊 Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (parseError) {
      console.log('❌ Could not parse response as JSON');
    }
    
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
    
  } catch (error) {
    console.error('❌ Raw login test failed:', error.message);
  }
}

// Also test the exact same request but with the known working admin
async function testWorkingAdmin() {
  try {
    console.log('\n🔍 Testing with known admin from database...');
    
    const loginData = {
      email: 'admin@thekua.com',
      password: 'Admin@123'  // From the .env file
    };
    
    console.log('📧 Admin login data:', loginData);
    
    const response = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    const responseData = await response.text();
    console.log('📄 Admin response text:', responseData);
    
    try {
      const jsonData = JSON.parse(responseData);
      console.log('📊 Admin parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (parseError) {
      console.log('❌ Could not parse admin response as JSON');
    }
    
    console.log('🔍 Admin response status:', response.status);
    
  } catch (error) {
    console.error('❌ Admin login test failed:', error.message);
  }
}

async function runRawTests() {
  await testRawLogin();
  await testWorkingAdmin();
}

runRawTests();
