# Admin User Management System

This document explains how to manage admin users in the TheKua website application.

## How the Admin System Works

1. **User Registration**: All users register normally through the website with the default role of 'user'
2. **Admin Promotion**: You manually promote users to admin status using database scripts
3. **Admin Access**: When admin users log in, they automatically get access to the admin dashboard

## Admin Features

When a user with admin role logs in, they get access to:
- **Admin Dashboard**: Overview of orders, products, and users
- **Order Management**: View and manage all customer orders
- **Product Management**: Add, edit, and manage products
- **User Management**: View and manage all users
- **Settings Panel**: Application settings and configuration

## Managing Admin Users

### 1. List All Users

To see all registered users and their roles:

```bash
cd thekua-backend
node scripts/listUsers.js
```

This will show:
- All users with their names, emails, and roles
- Summary of admin vs regular users
- User status (active/inactive)

### 2. Promote User to Admin

To promote a regular user to admin:

```bash
cd thekua-backend
node scripts/promoteToAdmin.js user@example.com
```

Example:
```bash
node scripts/promoteToAdmin.js john.doe@gmail.com
```

### 3. Demote Admin to User

To demote an admin back to regular user:

```bash
cd thekua-backend
node scripts/demoteFromAdmin.js admin@example.com
```

## Step-by-Step Admin Setup

### Step 1: Register a User Account
1. Go to the website
2. Click "Register" 
3. Fill in user details and create account
4. Note down the email address used

### Step 2: Promote to Admin
1. Open terminal/command prompt
2. Navigate to the backend directory:
   ```bash
   cd "c:\Users\harsh\Desktop\thekua website\thekua-backend"
   ```
3. Run the promotion script:
   ```bash
   node scripts/promoteToAdmin.js your-email@example.com
   ```

### Step 3: Login as Admin
1. Go back to the website
2. Login with the promoted user credentials
3. You should automatically see the admin interface
4. Access "Admin Dashboard" from the user menu

## Database Direct Access (Alternative Method)

If you prefer to use MongoDB directly:

### Using MongoDB Compass or Studio 3T:
1. Connect to your MongoDB database
2. Navigate to the `users` collection
3. Find the user by email
4. Change the `role` field from `"user"` to `"admin"`
5. Save the changes

### Using MongoDB Shell:
```javascript
// Connect to your database
use thekua-website

// Promote user to admin
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)

// Verify the change
db.users.findOne({ email: "user@example.com" }, { firstName: 1, lastName: 1, email: 1, role: 1 })
```

## Security Notes

1. **Protect Admin Access**: Only promote trusted users to admin role
2. **Regular Audits**: Regularly check admin users using `listUsers.js`
3. **Immediate Demotion**: If needed, quickly demote users with `demoteFromAdmin.js`
4. **Database Backups**: Always backup your database before making role changes

## Troubleshooting

### User Not Seeing Admin Panel
1. Check if user role is correctly set to "admin" in database
2. Make sure user logs out and logs back in after promotion
3. Clear browser cache and localStorage
4. Check browser console for any errors

### Script Errors
1. Make sure you're in the `thekua-backend` directory
2. Ensure MongoDB is running
3. Check the `.env` file has correct database connection string
4. Verify the email address is spelled correctly

### Admin Panel Not Loading
1. Check if user is authenticated and has admin role
2. Look for JavaScript errors in browser console
3. Ensure all admin components are properly imported

## Admin User Workflow

```
Registration → User Role → Database Update → Admin Role → Admin Dashboard
     ↓             ↓            ↓              ↓              ↓
  Website      Default       Scripts/     Login with      Full Admin
  Signup        'user'       MongoDB      Admin Role       Access
```

## Contact

If you need help with admin user management, check the application logs or contact the development team.
