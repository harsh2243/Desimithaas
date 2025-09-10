const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testUserCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-store');
    console.log('Connected to MongoDB');

    // Check current users
    const users = await User.find().select('firstName lastName email role createdAt');
    console.log('Current users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role}`);
    });

    console.log('\nTotal users:', users.length);
    console.log('Admin users:', users.filter(u => u.role === 'admin').length);
    console.log('Regular users:', users.filter(u => u.role === 'user').length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testUserCreation();
