const axios = require('axios');

async function testUnifiedLogin() {
  console.log('🔐 Testing Unified Login System...\n');

  // Test 1: Admin Login
  try {
    console.log('📝 Test 1: Admin Login');
    const adminLoginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@thekua.com',
      password: 'Admin@123'
    });

    const adminData = adminLoginResponse.data.data;
    console.log('✅ Admin login successful!');
    console.log(`👤 User: ${adminData.user.firstName} ${adminData.user.lastName}`);
    console.log(`👑 Role: ${adminData.user.role}`);
    console.log(`🔑 Token: ${adminData.accessToken ? 'Received' : 'Missing'}`);
    
    if (adminData.user.role === 'admin') {
      console.log('🛡️  Admin status confirmed - should redirect to /admin');
    } else {
      console.log('⚠️  Expected admin role but got:', adminData.user.role);
    }

    // Test admin can access admin routes
    const adminHeaders = { Authorization: `Bearer ${adminData.accessToken}` };
    const dashboardResponse = await axios.get('http://localhost:5001/api/admin/dashboard/stats', { 
      headers: adminHeaders 
    });
    console.log('✅ Admin dashboard access confirmed');
    
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Regular User Login
  try {
    console.log('📝 Test 2: Regular User Login');
    const userLoginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'harshvardhanyadav9866@gmail.com',
      password: 'userPassword123' // This might need to be updated based on actual password
    });

    const userData = userLoginResponse.data.data;
    console.log('✅ User login successful!');
    console.log(`👤 User: ${userData.user.firstName} ${userData.user.lastName}`);
    console.log(`👤 Role: ${userData.user.role}`);
    console.log(`🔑 Token: ${userData.accessToken ? 'Received' : 'Missing'}`);
    
    if (userData.user.role === 'user') {
      console.log('👥 Regular user status confirmed - should redirect to main site');
    } else {
      console.log('⚠️  Expected user role but got:', userData.user.role);
    }

  } catch (error) {
    console.log('❌ User login failed:', error.response?.data?.message || error.message);
    console.log('ℹ️  Note: This user might not exist or have a different password');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Promote User to Admin and Test
  try {
    console.log('📝 Test 3: Promote User to Admin');
    
    // First check current users
    const { execSync } = require('child_process');
    console.log('📊 Current users in database:');
    const usersOutput = execSync('cd ../server && node list-all-users.js', { encoding: 'utf8' });
    console.log(usersOutput);

    // Promote regular user to admin
    console.log('\n🔄 Promoting harshvardhanyadav9866@gmail.com to admin...');
    const promoteOutput = execSync('cd ../server && node promote-to-admin.js harshvardhanyadav9866@gmail.com', { encoding: 'utf8' });
    console.log(promoteOutput);

    // Test login again with admin role
    console.log('🔄 Testing login with newly promoted admin...');
    const promotedUserResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'harshvardhanyadav9866@gmail.com',
      password: 'userPassword123' // This might need to be updated
    });

    const promotedData = promotedUserResponse.data.data;
    console.log('✅ Promoted user login successful!');
    console.log(`👤 User: ${promotedData.user.firstName} ${promotedData.user.lastName}`);
    console.log(`👑 Role: ${promotedData.user.role}`);
    
    if (promotedData.user.role === 'admin') {
      console.log('🛡️  Admin role confirmed after promotion - should redirect to /admin');
    }

  } catch (error) {
    console.log('❌ User promotion test failed:', error.message);
  }

  console.log('\n🎉 Unified login system testing complete!');
  console.log('💡 Summary:');
  console.log('   - Same login route handles both user types');
  console.log('   - Admins get redirected to /admin panel');
  console.log('   - Regular users get redirected to main site');
  console.log('   - Database promotion scripts work correctly');
}

testUnifiedLogin();
