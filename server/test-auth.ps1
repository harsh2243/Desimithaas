# Test Auth Endpoints
Write-Host "Testing Authentication Endpoints..." -ForegroundColor Green

# Test Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5001/api/health" -Method GET
    Write-Host "✅ Health Check Success:" -ForegroundColor Green
    $health | ConvertTo-Json
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Registration
Write-Host "`n2. Testing Registration..." -ForegroundColor Yellow
$registerBody = @{
    firstName = "John"
    lastName = "Doe"
    email = "john.doe@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registration Success:" -ForegroundColor Green
    $register | ConvertTo-Json
    
    # Test Login with same credentials
    Write-Host "`n3. Testing Login..." -ForegroundColor Yellow
    $loginBody = @{
        email = "john.doe@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    $login = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login Success:" -ForegroundColor Green
    $login | ConvertTo-Json
    
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "ℹ️ User already exists, testing login..." -ForegroundColor Blue
        
        # Test Login
        Write-Host "`n3. Testing Login..." -ForegroundColor Yellow
        $loginBody = @{
            email = "john.doe@example.com"
            password = "password123"
        } | ConvertTo-Json
        
        try {
            $login = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
            Write-Host "✅ Login Success:" -ForegroundColor Green
            $login | ConvertTo-Json
        } catch {
            Write-Host "❌ Login Failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Registration Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Testing Complete!" -ForegroundColor Green