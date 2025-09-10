const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testAdminUsersAPI() {
  try {
    console.log('🔐 Testing Admin Users API...');
    
    // First, login as admin
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'newadmin@thekua.com',
      password: 'NewAdmin123'
    });
    
    if (loginResponse.data.status === 'success') {
      console.log('✅ Admin login successful');
      const token = loginResponse.data.data.token;
      
      // Test getting users
      console.log('\n2. Testing GET /api/admin/users...');
      const usersResponse = await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (usersResponse.data.status === 'success') {
        console.log('✅ Users API working');
        console.log(`Found ${usersResponse.data.data.users.length} users`);
        console.log('Pagination:', usersResponse.data.data.pagination);
      } else {
        console.log('❌ Users API failed:', usersResponse.data.message);
      }
      
      // Test creating a user
      console.log('\n3. Testing POST /api/admin/users (create user)...');
      const createUserResponse = await axios.post(`${BASE_URL}/api/admin/users`, {
        firstName: 'API',
        lastName: 'Test',
        email: `apitest${Date.now()}@example.com`,
        password: 'ApiTest123',
        role: 'user',
        phone: '9876543210'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (createUserResponse.data.status === 'success') {
        console.log('✅ User creation successful');
        console.log('Created user:', createUserResponse.data.data.user.email);
        
        // Test deleting the user
        const userId = createUserResponse.data.data.user._id;
        console.log('\n4. Testing DELETE /api/admin/users/:id...');
        
        const deleteResponse = await axios.delete(`${BASE_URL}/api/admin/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (deleteResponse.data.status === 'success') {
          console.log('✅ User deletion successful');
        } else {
          console.log('❌ User deletion failed:', deleteResponse.data.message);
        }
        
      } else {
        console.log('❌ User creation failed:', createUserResponse.data.message);
      }
      
    } else {
      console.log('❌ Admin login failed:', loginResponse.data.message);
    }
    
    console.log('\n🎉 API testing completed!');
    
  } catch (error) {
    console.error('❌ API test error:', error.response?.data || error.message);
  }
}

testAdminUsersAPI();
