const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

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

async function createTestUser() {
  try {
    console.log('👤 Creating test regular user...');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: 'testuser@example.com' });
    if (existingUser) {
      console.log('⚠️  User already exists, deleting and recreating...');
      await User.deleteOne({ email: 'testuser@example.com' });
    }

    // Create new regular user
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'TestUser123',
      role: 'user',
      isActive: true,
      loginAttempts: 0
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    
    // Verify the user
    const savedUser = await User.findOne({ email: 'testuser@example.com' });
    console.log('📊 User Details:');
    console.log(`   Name: ${savedUser.firstName} ${savedUser.lastName}`);
    console.log(`   Email: ${savedUser.email}`);
    console.log(`   Role: ${savedUser.role}`);
    console.log(`   Active: ${savedUser.isActive}`);
    console.log(`   Login Attempts: ${savedUser.loginAttempts}`);
    
    // Test password validation
    const isPasswordValid = await savedUser.comparePassword('TestUser123');
    console.log(`   Password Valid: ${isPasswordValid ? '✅' : '❌'}`);
    
    // Also fix the locked admin user
    console.log('\n🔧 Fixing locked admin user...');
    const lockedUser = await User.findOne({ email: 'harshvardhanyadav9866@gmail.com' });
    if (lockedUser) {
      await lockedUser.resetLoginAttempts();
      console.log('✅ Reset login attempts for admin user');
    }
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

connectDB().then(() => {
  createTestUser();
});
