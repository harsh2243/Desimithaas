const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website';

async function demoteAdminToUser(email) {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('⚠️  User is not an admin:', user.firstName, user.lastName);
      return;
    }

    // Demote admin to user
    user.role = 'user';
    await user.save();

    console.log('✅ Admin demoted to user successfully!');
    console.log('👤 User Details:');
    console.log('   Name:', user.firstName, user.lastName);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   User ID:', user._id);

  } catch (error) {
    console.error('❌ Error demoting admin to user:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node demote-from-admin.js admin@example.com');
  process.exit(1);
}

demoteAdminToUser(email);
