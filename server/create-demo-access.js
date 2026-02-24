const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website';

const DEMO_ACCOUNTS = [
  {
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@thekua.com',
    password: 'Demo@123',
    role: 'user',
    phone: '9999999999'
  },
  {
    firstName: 'Demo',
    lastName: 'Admin',
    email: 'admin@thekua.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '9999999998'
  }
];

async function upsertDemoAccount(account) {
  const existingUser = await User.findOne({ email: account.email });

  if (existingUser) {
    existingUser.firstName = account.firstName;
    existingUser.lastName = account.lastName;
    existingUser.password = account.password;
    existingUser.role = account.role;
    existingUser.phone = account.phone;
    await existingUser.save();
    return { type: 'updated', email: account.email, role: account.role };
  }

  const createdUser = new User(account);
  await createdUser.save();
  return { type: 'created', email: account.email, role: account.role };
}

async function setupDemoAccess() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const results = [];
    for (const account of DEMO_ACCOUNTS) {
      const result = await upsertDemoAccount(account);
      results.push(result);
    }

    console.log('\n✅ Demo access ready:');
    results.forEach((result) => {
      console.log(`- ${result.type.toUpperCase()}: ${result.email} (${result.role})`);
    });

    console.log('\n🔑 Demo Credentials:');
    console.log('User Login  -> demo@thekua.com / Demo@123');
    console.log('Admin Login -> admin@thekua.com / Admin@123');
  } catch (error) {
    console.error('❌ Failed to set up demo access:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

setupDemoAccess();
