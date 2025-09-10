const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Script to list all users with their roles
 * Usage: node scripts/listUsers.js
 */

const listUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users
    const users = await User.find({})
      .select('firstName lastName email role isActive createdAt lastLogin')
      .sort({ createdAt: -1 });

    if (users.length === 0) {
      console.log('ℹ️  No users found in the database');
      return;
    }

    console.log(`\n📋 Found ${users.length} users:\n`);
    
    // Display users in a table format
    console.log('┌─────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│                                 USER LIST                                      │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────┤');
    console.log('│ Name              │ Email                    │ Role  │ Status │ Created       │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────┤');

    users.forEach((user, index) => {
      const name = `${user.firstName} ${user.lastName}`.substring(0, 16).padEnd(16);
      const email = user.email.substring(0, 23).padEnd(23);
      const role = user.role.padEnd(5);
      const status = (user.isActive ? 'Active' : 'Inactive').padEnd(6);
      const created = user.createdAt.toLocaleDateString().padEnd(12);
      
      console.log(`│ ${name} │ ${email} │ ${role} │ ${status} │ ${created} │`);
    });

    console.log('└─────────────────────────────────────────────────────────────────────────────────┘');

    // Summary
    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role === 'user').length;
    const activeCount = users.filter(u => u.isActive).length;

    console.log(`\n📊 Summary:`);
    console.log(`   👥 Total Users: ${users.length}`);
    console.log(`   👑 Admins: ${adminCount}`);
    console.log(`   👤 Regular Users: ${userCount}`);
    console.log(`   ✅ Active: ${activeCount}`);
    console.log(`   ❌ Inactive: ${users.length - activeCount}`);

    if (adminCount === 0) {
      console.log('\n⚠️  No admin users found! Use promoteToAdmin.js to create an admin.');
    }

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
listUsers();
