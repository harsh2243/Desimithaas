const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website';

async function createTestAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'newadmin@thekua.com' });
    if (existingUser) {
      console.log('❌ User with this email already exists');
      // Update existing user to admin
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('✅ Updated existing user to admin role');
    } else {
      // Create new admin user with the exact credentials from your JSON
      const adminUser = new User({
        firstName: 'New',
        lastName: 'Admin',
        email: 'newadmin@thekua.com',
        password: 'NewAdmin123',
        role: 'admin'
      });

      await adminUser.save();
      console.log('✅ Test admin user created successfully!');
    }
    
    console.log('🔑 Test Admin Credentials:');
    console.log('Email: newadmin@thekua.com');
    console.log('Password: NewAdmin123');
    console.log('Role: admin');

    // Test login
    const testUser = await User.findOne({ email: 'newadmin@thekua.com' }).select('+password');
    const isPasswordValid = await testUser.comparePassword('NewAdmin123');
    
    console.log('🔐 Password validation:', isPasswordValid ? 'VALID ✅' : 'INVALID ❌');

  } catch (error) {
    console.error('❌ Error creating test admin:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

createTestAdmin();
