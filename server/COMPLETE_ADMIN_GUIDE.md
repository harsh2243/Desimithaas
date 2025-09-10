# Complete Admin Management Guide

## 🔐 Admin User System Overview

This system allows you to manage admin users for your e-commerce website. All users start as regular users, and admin privileges are granted by updating the database.

## 📋 How It Works

1. **Registration**: Users register normally through the website with role 'user'
2. **Admin Promotion**: You manually promote users to admin using database scripts
3. **Admin Access**: When users with admin role log in, they get access to the admin panel
4. **Admin Panel**: Full access to products, orders, users, and dashboard

## 🚀 Quick Start Guide

### Step 1: Register a User Account
1. Go to your website: `http://localhost:3002` (or your frontend URL)
2. Click "Login" → "Register"
3. Fill in the registration form
4. Note down the email address you used

### Step 2: Check All Users
```bash
cd c:\Users\harsh\Downloads\Website-main\Website-main\server
node list-all-users.js
```

### Step 3: Promote User to Admin
```bash
cd c:\Users\harsh\Downloads\Website-main\Website-main\server
node promote-to-admin.js user@example.com
```

### Step 4: Login as Admin
1. Go back to the website
2. Login with the promoted user credentials
3. You'll see "Admin Panel" in the user menu
4. Click "Admin Panel" to access the dashboard

## 📜 Available Scripts

### 1. List All Users
**Command:** `node list-all-users.js`
**Purpose:** View all registered users and their roles

Example output:
```
🛡️  ADMIN USERS:
1. John Doe
   📧 Email: john@example.com
   👑 Role: ADMIN
   ✅ Active | 📅 Joined: 07/08/2025

👥 REGULAR USERS:
1. Jane Smith
   📧 Email: jane@example.com
   👤 Role: user
   ✅ Active | 📅 Joined: 07/08/2025
```

### 2. Promote User to Admin
**Command:** `node promote-to-admin.js user@example.com`
**Purpose:** Promote a regular user to admin

Example:
```bash
node promote-to-admin.js jane@example.com
```

### 3. Demote Admin to User
**Command:** `node demote-from-admin.js admin@example.com`
**Purpose:** Remove admin privileges from a user

Example:
```bash
node demote-from-admin.js john@example.com
```

### 4. Create Test Admin (Already exists)
**Command:** `node create-test-admin.js`
**Purpose:** Creates a test admin user with preset credentials

Test Admin Credentials:
- Email: `newadmin@thekua.com`
- Password: `NewAdmin123`

## 🎯 Admin Panel Features

Once logged in as admin, you get access to:

### 📊 Dashboard
- Sales overview and statistics
- Recent orders and top products
- Quick action buttons
- Revenue and customer metrics

### 📦 Products Management
- View all products with search and filters
- Add new products with images
- Edit existing product details
- Delete products
- Manage featured products
- Track product performance

### 🛒 Orders Management
- View all customer orders
- Update order status (pending → confirmed → shipped → delivered)
- View detailed order information
- Customer contact details
- Payment status tracking

### 👥 Users Management
- View all registered users
- Promote/demote admin privileges
- Activate/deactivate user accounts
- View user details and activity
- Search and filter users

## 🔧 Database Direct Access (Alternative Method)

If you prefer to use MongoDB directly:

### Using MongoDB Compass:
1. Connect to: `mongodb://localhost:27017/thekua-website`
2. Navigate to the `users` collection
3. Find the user by email
4. Change the `role` field from `"user"` to `"admin"`
5. Save the changes

### Using MongoDB Shell:
```javascript
// Connect to database
use thekua-website

// Promote user to admin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)

// Verify the change
db.users.findOne(
  { email: "user@example.com" }, 
  { firstName: 1, lastName: 1, email: 1, role: 1 }
)
```

## 🛡️ Security Best Practices

1. **Limit Admin Access**: Only promote trusted users to admin
2. **Regular Audits**: Use `list-all-users.js` to regularly check admin users
3. **Quick Response**: Use `demote-from-admin.js` if you need to remove access
4. **Backup Database**: Always backup before making role changes
5. **Monitor Activity**: Check admin actions through the dashboard

## 🚨 Troubleshooting

### Problem: User doesn't see Admin Panel after promotion
**Solution:**
1. Make sure the user logs out and logs back in
2. Clear browser cache and localStorage
3. Verify the role change using `list-all-users.js`

### Problem: Script shows "User not found"
**Solution:**
1. Check the email spelling
2. Ensure the user has registered on the website
3. Use `list-all-users.js` to see all available users

### Problem: Admin Panel not loading
**Solution:**
1. Check if both frontend and backend servers are running
2. Verify user is authenticated and has admin role
3. Check browser console for JavaScript errors

## 📝 Example Workflow

```bash
# 1. Check current users
node list-all-users.js

# 2. Promote a user to admin
node promote-to-admin.js john.doe@gmail.com

# 3. Verify the promotion
node list-all-users.js

# 4. If needed, demote later
node demote-from-admin.js john.doe@gmail.com
```

## 🌐 Access URLs

- **Website**: http://localhost:3002
- **Admin Panel**: http://localhost:3002/admin (after admin login)
- **Login Page**: http://localhost:3002/auth/login
- **Register Page**: http://localhost:3002/auth/register

## 📞 Support

If you need help:
1. Check this documentation first
2. Verify both servers are running
3. Check the terminal for error messages
4. Use the troubleshooting section above

---

**Remember**: Admin status is role-based, not account-based. Any user can become an admin, and any admin can be demoted to a regular user using the provided scripts.
