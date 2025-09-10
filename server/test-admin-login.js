const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website';

async function testAdminLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@thekua.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Admin user found:', {
      email: admin.email,
      role: admin.role,
      hasPassword: !!admin.password
    });

    // Test password comparison
    const testPassword = 'Admin123';
    const isValid = await admin.comparePassword(testPassword);
    
    console.log('🔐 Password test result:', isValid);
    
    if (!isValid) {
      console.log('❌ Password comparison failed');
      console.log('Password hash in DB:', admin.password.substring(0, 20) + '...');
      
      // Test direct bcrypt comparison
      const directComparison = await bcrypt.compare(testPassword, admin.password);
      console.log('Direct bcrypt comparison:', directComparison);
    } else {
      console.log('✅ Password is correct!');
    }

  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testAdminLogin();
