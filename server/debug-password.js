const mongoose = require('mongoose');
const User = require('./models/User');

async function debugPasswordIssue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website');
    console.log('✅ Connected to MongoDB');

    // Test with the admin we just created
    const testAdmin = await User.findOne({ email: 'testadmin@example.com' }).select('+password');
    if (testAdmin) {
      console.log('👤 Found test admin:');
      console.log('   Email:', testAdmin.email);
      console.log('   Role:', testAdmin.role);
      console.log('   Password hash exists:', !!testAdmin.password);
      console.log('   Password hash (first 20 chars):', testAdmin.password?.substring(0, 20));
      
      // Test password comparison
      console.log('\n🔐 Testing password comparison:');
      const password = 'TestAdmin123';
      
      try {
        const isValid = await testAdmin.comparePassword(password);
        console.log('   Password validation result:', isValid);
      } catch (error) {
        console.error('   Password comparison error:', error.message);
      }
      
      // Check User model methods
      console.log('\n🔍 User model methods:');
      console.log('   comparePassword method exists:', typeof testAdmin.comparePassword === 'function');
      
    } else {
      console.log('❌ Test admin not found');
    }

    // Also test with original admin
    const originalAdmin = await User.findOne({ email: 'newadmin@thekua.com' }).select('+password');
    if (originalAdmin) {
      console.log('\n👤 Found original admin:');
      console.log('   Email:', originalAdmin.email);
      console.log('   Role:', originalAdmin.role);
      console.log('   Password hash exists:', !!originalAdmin.password);
      
      const isValid = await originalAdmin.comparePassword('NewAdmin123');
      console.log('   Password validation result:', isValid);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

debugPasswordIssue();
