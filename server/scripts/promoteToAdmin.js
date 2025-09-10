const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Script to promote a user to admin role
 * Usage: node scripts/promoteToAdmin.js <email>
 * Example: node scripts/promoteToAdmin.js user@example.com
 */

const promoteToAdmin = async (email) => {
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

    // Check if already admin
    if (user.role === 'admin') {
      console.log('ℹ️  User is already an admin:', email);
      return;
    }

    // Update user role to admin
    user.role = 'admin';
    await user.save();

    console.log('🎉 Successfully promoted user to admin!');
    console.log('👤 User Details:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created: ${user.createdAt}`);

  } catch (error) {
    console.error('❌ Error promoting user to admin:', error.message);
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
  console.log('Usage: node scripts/promoteToAdmin.js <email>');
  console.log('Example: node scripts/promoteToAdmin.js user@example.com');
  process.exit(1);
}

// Run the promotion
promoteToAdmin(email);
