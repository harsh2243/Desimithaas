const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thekua-website';

async function fixAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@thekua.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    // Update password - this will trigger the pre-save hook for hashing
    admin.password = 'Admin123';
    await admin.save();
    
    console.log('✅ Admin password updated successfully!');
    
    // Test the new password
    const adminWithPassword = await User.findOne({ email: 'admin@thekua.com' }).select('+password');
    const isValid = await adminWithPassword.comparePassword('Admin123');
    
    console.log('🔐 Password test result:', isValid);

  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

fixAdminPassword();
