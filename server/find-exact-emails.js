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

async function findExactEmails() {
  try {
    console.log('🔍 Finding exact email addresses...');
    
    // Get all users and their exact emails
    const allUsers = await User.find({}, 'email firstName lastName role');
    
    console.log('\n📊 All users in database:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. "${user.email}" - ${user.firstName} ${user.lastName} (${user.role})`);
    });
    
    // Try to find any user with email containing "testadmin"
    const testUsers = await User.find({ email: { $regex: 'testadmin', $options: 'i' } });
    
    console.log('\n🔍 Users with "testadmin" in email:');
    testUsers.forEach(user => {
      console.log(`Email: "${user.email}"`);
    });
    
  } catch (error) {
    console.error('❌ Error finding emails:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the check
connectDB().then(() => {
  findExactEmails();
});
