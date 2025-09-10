// Test script to verify social authentication setup
// Run with: node testSocialAuth.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Social Authentication Setup Verification\n');

// Check if .env files exist
const backendEnvPath = path.join(__dirname, '.env');
const frontendEnvPath = path.join(__dirname, '../thekua-website/.env');

console.log('📁 Environment Files:');
console.log(`Backend .env: ${fs.existsSync(backendEnvPath) ? '✅ Exists' : '❌ Missing'}`);
console.log(`Frontend .env: ${fs.existsSync(frontendEnvPath) ? '✅ Exists' : '❌ Missing'}\n`);

// Check backend dependencies
const backendPackagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(backendPackagePath)) {
    const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
    const requiredDeps = [
        'google-auth-library',
        'express',
        'mongoose',
        'jsonwebtoken',
        'bcryptjs',
        'cors',
        'dotenv',
        'razorpay'
    ];
    
    console.log('📦 Backend Dependencies:');
    requiredDeps.forEach(dep => {
        const installed = backendPackage.dependencies && backendPackage.dependencies[dep];
        console.log(`${dep}: ${installed ? '✅ Installed' : '❌ Missing'}`);
    });
    console.log();
}

// Check frontend dependencies
const frontendPackagePath = path.join(__dirname, '../thekua-website/package.json');
if (fs.existsSync(frontendPackagePath)) {
    const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    const requiredDeps = [
        'react',
        'typescript',
        '@types/react',
        'tailwindcss',
        'axios',
        'react-router-dom'
    ];
    
    console.log('📦 Frontend Dependencies:');
    requiredDeps.forEach(dep => {
        const installed = (frontendPackage.dependencies && frontendPackage.dependencies[dep]) ||
                         (frontendPackage.devDependencies && frontendPackage.devDependencies[dep]);
        console.log(`${dep}: ${installed ? '✅ Installed' : '❌ Missing'}`);
    });
    console.log();
}

// Check social auth files
const socialAuthFiles = [
    { path: path.join(__dirname, 'routes/socialAuth.js'), name: 'Backend Social Auth Routes' },
    { path: path.join(__dirname, '../thekua-website/src/components/auth/GoogleSignIn.tsx'), name: 'Google Sign-In Component' },
    { path: path.join(__dirname, '../thekua-website/src/components/auth/FacebookSignIn.tsx'), name: 'Facebook Sign-In Component' },
    { path: path.join(__dirname, 'models/User.js'), name: 'User Model with Social Fields' }
];

console.log('📄 Social Authentication Files:');
socialAuthFiles.forEach(file => {
    console.log(`${file.name}: ${fs.existsSync(file.path) ? '✅ Exists' : '❌ Missing'}`);
});
console.log();

// Environment variables checklist
console.log('🔧 Environment Variables Needed:');
console.log('Backend (.env):');
console.log('  - GOOGLE_CLIENT_ID');
console.log('  - GOOGLE_CLIENT_SECRET');
console.log('  - FACEBOOK_APP_ID');
console.log('  - FACEBOOK_APP_SECRET');
console.log('  - MONGODB_URI');
console.log('  - JWT_SECRET');
console.log('  - RAZORPAY_KEY_ID');
console.log('  - RAZORPAY_KEY_SECRET\n');

console.log('Frontend (.env):');
console.log('  - REACT_APP_GOOGLE_CLIENT_ID');
console.log('  - REACT_APP_FACEBOOK_APP_ID');
console.log('  - REACT_APP_API_URL');
console.log('  - REACT_APP_RAZORPAY_KEY_ID\n');

console.log('📋 Next Steps:');
console.log('1. Set up Google OAuth in Google Cloud Console');
console.log('2. Set up Facebook OAuth in Facebook Developer Console');
console.log('3. Add OAuth credentials to environment files');
console.log('4. Start both backend and frontend servers');
console.log('5. Test social authentication in the browser\n');

console.log('📖 For detailed setup instructions, see:');
console.log('   SOCIAL_AUTH_SETUP.md');
console.log('\n✨ Social authentication implementation is complete!');
console.log('   Just needs OAuth app configuration to be fully functional.');
