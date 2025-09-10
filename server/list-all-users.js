const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website';

async function listAllUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({}).select('firstName lastName email role isActive createdAt').sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('⚠️  No users found in the database');
      return;
    }

    console.log(`📊 Found ${users.length} users:\n`);
    
    // Separate admins and regular users
    const admins = users.filter(user => user.role === 'admin');
    const regularUsers = users.filter(user => user.role === 'user');

    // Display admins
    if (admins.length > 0) {
      console.log('🛡️  ADMIN USERS:');
      console.log('=' .repeat(80));
      admins.forEach((user, index) => {
        const status = user.isActive ? '✅ Active' : '❌ Inactive';
        const joinDate = user.createdAt.toLocaleDateString('en-IN');
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👑 Role: ${user.role.toUpperCase()}`);
        console.log(`   ${status} | 📅 Joined: ${joinDate}`);
        console.log(`   🆔 ID: ${user._id}`);
        console.log('');
      });
    }

    // Display regular users
    if (regularUsers.length > 0) {
      console.log('👥 REGULAR USERS:');
      console.log('=' .repeat(80));
      regularUsers.forEach((user, index) => {
        const status = user.isActive ? '✅ Active' : '❌ Inactive';
        const joinDate = user.createdAt.toLocaleDateString('en-IN');
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   ${status} | 📅 Joined: ${joinDate}`);
        console.log(`   🆔 ID: ${user._id}`);
        console.log('');
      });
    }

    // Summary
    console.log('📈 SUMMARY:');
    console.log('=' .repeat(40));
    console.log(`Total Users: ${users.length}`);
    console.log(`Admin Users: ${admins.length}`);
    console.log(`Regular Users: ${regularUsers.length}`);
    console.log(`Active Users: ${users.filter(u => u.isActive).length}`);
    console.log(`Inactive Users: ${users.filter(u => !u.isActive).length}`);

    console.log('\n💡 To promote a user to admin, run:');
    console.log('   node promote-to-admin.js user@example.com');
    console.log('\n💡 To demote an admin to user, run:');
    console.log('   node demote-from-admin.js admin@example.com');

  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

listAllUsers();
