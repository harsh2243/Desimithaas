const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website';

async function createFreshTestAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a fresh test admin with unique email
    const adminEmail = 'testadmin@example.com';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log('❌ User with this email already exists');
      // Update existing user to admin
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('✅ Updated existing user to admin role');
    } else {
      // Create new admin user
      const adminUser = new User({
        firstName: 'Test',
        lastName: 'Admin',
        email: adminEmail,
        password: 'TestAdmin123',
        role: 'admin',
        emailVerified: true
      });

      await adminUser.save();
      console.log('✅ Fresh test admin user created successfully!');
    }
    
    console.log('🔑 Fresh Test Admin Credentials:');
    console.log('Email: testadmin@example.com');
    console.log('Password: TestAdmin123');
    console.log('Role: admin');

    // Verify the user exists and has correct role
    const testUser = await User.findOne({ email: adminEmail }).select('+password');
    if (testUser) {
      console.log('✅ User verified in database:');
      console.log('   Name:', testUser.firstName, testUser.lastName);
      console.log('   Email:', testUser.email);
      console.log('   Role:', testUser.role);
      console.log('   Password Hash:', testUser.password ? 'Set' : 'Not Set');
      
      // Test password validation
      const isPasswordValid = await testUser.comparePassword('TestAdmin123');
      console.log('🔐 Password validation:', isPasswordValid ? 'VALID ✅' : 'INVALID ❌');
    } else {
      console.log('❌ User not found in database!');
    }

  } catch (error) {
    console.error('❌ Error creating fresh test admin:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

createFreshTestAdmin();
