const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Script to demote an admin user to regular user role
 * Usage: node scripts/demoteFromAdmin.js <email>
 * Example: node scripts/demoteFromAdmin.js admin@example.com
 */

const demoteFromAdmin = async (email) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('ℹ️  User is not an admin:', email);
      console.log(`   Current role: ${user.role}`);
      return;
    }

    // Update user role to regular user
    user.role = 'user';
    await user.save();

    console.log('✅ Successfully demoted admin to regular user!');
    console.log('👤 User Details:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);

  } catch (error) {
    console.error('❌ Error demoting admin user:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node scripts/demoteFromAdmin.js <email>');
  console.log('Example: node scripts/demoteFromAdmin.js admin@example.com');
  process.exit(1);
}

// Run the demotion
demoteFromAdmin(email);
