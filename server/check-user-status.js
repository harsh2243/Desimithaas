const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Import User model
const User = require('./models/User');

async function checkUserStatus() {
  try {
    console.log('🔍 Checking user account status...');
    
    // First, let's find the user without selecting password
    const testUser = await User.findOne({ email: 'testadmin@example.com' });
    
    if (!testUser) {
      console.log('❌ Test admin not found');
      return;
    }
    
    console.log('\n📊 Test Admin Basic Info:');
    console.log('Email:', testUser.email);
    console.log('Role:', testUser.role);
    console.log('Is Active:', testUser.isActive);
    console.log('Is Locked:', testUser.isLocked);
    console.log('Login Attempts:', testUser.loginAttempts);
    console.log('Last Login:', testUser.lastLogin);
    console.log('Account Lock Until:', testUser.lockUntil);
    
    // Now get the same user with password
    const testAdmin = await User.findOne({ email: 'testadmin@example.com' }).select('+password');
    
    console.log('\n🔐 Password Info:');
    console.log('Password Hash Length:', testAdmin.password ? testAdmin.password.length : 'No password');
    
    // Test password comparison
    if (testAdmin.password) {
      const isPasswordValid = await testAdmin.comparePassword('TestAdmin123');
      console.log('Password Comparison Result:', isPasswordValid);
    }
    
    // Also check the original admin
    const originalAdmin = await User.findOne({ email: 'newadmin@thekua.com' }).select('+password');
    
    if (originalAdmin) {
      console.log('\n📊 Original Admin Status:');
      console.log('Email:', originalAdmin.email);
      console.log('Role:', originalAdmin.role);
      console.log('Is Active:', originalAdmin.isActive);
      console.log('Is Locked:', originalAdmin.isLocked);
      console.log('Login Attempts:', originalAdmin.loginAttempts);
      console.log('Last Login:', originalAdmin.lastLogin);
      console.log('Account Lock Until:', originalAdmin.lockUntil);
      console.log('Password Hash Length:', originalAdmin.password ? originalAdmin.password.length : 'No password');
      
      if (originalAdmin.password) {
        const isPasswordValid = await originalAdmin.comparePassword('NewAdmin123');
        console.log('Password Comparison Result:', isPasswordValid);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking user status:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the check
connectDB().then(() => {
  checkUserStatus();
});
