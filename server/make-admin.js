const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website';

async function makeUserAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the user by email and update role to admin
    const userEmail = 'harshvardhanyadav9866@gmail.com'; // Using existing user
    
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { role: 'admin' },
      { new: true }
    );

    if (updatedUser) {
      console.log('✅ User role updated successfully!');
      console.log('User:', {
        email: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        role: updatedUser.role
      });
    } else {
      console.log('❌ User not found with email:', userEmail);
    }

  } catch (error) {
    console.error('❌ Error updating user role:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

makeUserAdmin();
