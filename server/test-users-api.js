const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website';

async function testUsersAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test getting all users
    console.log('\n📋 Testing Users List...');
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });

    // Test creating a new user
    console.log('\n👤 Testing User Creation...');
    const testUserEmail = `testuser${Date.now()}@example.com`;
    
    const newUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: testUserEmail,
      password: 'TestUser123',
      role: 'user',
      phone: '1234567890'
    });

    await newUser.save();
    console.log(`✅ Created new user: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`);

    // Clean up - delete the test user
    await User.findByIdAndDelete(newUser._id);
    console.log('🗑️ Cleaned up test user');

    console.log('\n✅ All user API tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUsersAPI();
