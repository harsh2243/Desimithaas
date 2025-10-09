## 🧪 Manual Testing Guide for Login/Signup

### **Current Setup:**
- **Frontend**: http://localhost:3001/
- **Backend**: http://localhost:5001/
- **Backend API Base**: http://localhost:5001/api

### **Step 1: Test Backend Directly**

Open a new PowerShell terminal and run these commands:

```powershell
# Test Health Check
Invoke-RestMethod -Uri "http://localhost:5001/api/health" -Method GET

# Test Registration
$registerBody = @{
    firstName = "John"
    lastName = "Doe" 
    email = "john.doe@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"

# Test Login
$loginBody = @{
    email = "john.doe@example.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
```

### **Step 2: Test Frontend**

1. Open your browser and go to http://localhost:3001/
2. Look for Login/Register forms
3. Try to register a new user
4. Try to login with the registered user

### **Expected Results:**
- ✅ Health check should return server status
- ✅ Registration should create user and return token
- ✅ Login should authenticate and return token
- ✅ Frontend forms should work without CORS errors

### **If Tests Fail:**
Check the browser console and server logs for error messages.