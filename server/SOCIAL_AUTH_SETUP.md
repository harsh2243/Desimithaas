# Social Authentication Setup Guide

This guide explains how to set up Google and Facebook OAuth authentication for the TheKua website.

## Prerequisites

- Google Cloud Console account
- Facebook Developer account
- TheKua website running locally or deployed

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it "TheKua Website" or similar

### 2. Enable Google+ API

1. In the Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity Services"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure consent screen if prompted:
   - Application name: "TheKua Website"
   - User support email: your email
   - Developer contact: your email
4. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "TheKua Web Client"
   - Authorized origins: 
     - `http://localhost:3000` (for development)
     - `http://localhost:3001` (if using different port)
     - Your production domain
   - Authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - Your production domain

### 4. Get Client ID

1. Copy the "Client ID" (starts with something like `123456789-abc...googleusercontent.com`)
2. You don't need the Client Secret for frontend OAuth

## Facebook OAuth Setup

### 1. Create Facebook App

1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Click "My Apps" > "Create App"
3. Choose "Consumer" as app type
4. Fill in app details:
   - App name: "TheKua Website"
   - App contact email: your email
   - Business account: optional

### 2. Add Facebook Login Product

1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Choose "Web" as platform
4. Set Site URL to:
   - `http://localhost:3000` (for development)
   - Your production domain

### 3. Configure Valid OAuth Redirect URIs

1. Go to Facebook Login > Settings
2. Add these Valid OAuth Redirect URIs:
   - `http://localhost:3000` (for development)
   - `http://localhost:3001` (if using different port)
   - Your production domain

### 4. Get App ID

1. Go to Settings > Basic
2. Copy the "App ID"
3. You don't need App Secret for frontend OAuth

## Environment Configuration

### Backend (.env)

Update your backend `.env` file:

```properties
# Social Authentication Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

### Frontend (.env)

Update your frontend `.env` file:

```properties
# Social Authentication Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here.googleusercontent.com
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id_here
```

## Testing Social Authentication

### 1. Start the Application

```bash
# Start backend
cd thekua-backend
npm run dev

# Start frontend (in another terminal)
cd thekua-website
npm start
```

### 2. Test Google Sign-In

1. Open the website
2. Click "Register" or "Sign In"
3. Click "Continue with Google"
4. Sign in with your Google account
5. Grant permissions
6. You should be logged in automatically

### 3. Test Facebook Sign-In

1. Open the website
2. Click "Register" or "Sign In"
3. Click "Continue with Facebook"
4. Sign in with your Facebook account
5. Grant permissions
6. You should be logged in automatically

## Production Deployment

### 1. Update OAuth Settings

For production, update:

**Google Cloud Console:**
- Add your production domain to authorized origins
- Add your production domain to redirect URIs

**Facebook Developer Console:**
- Add your production domain to Valid OAuth Redirect URIs
- Change app from Development to Live mode

### 2. Update Environment Variables

Update your production environment variables with the same values.

### 3. SSL Certificate

Ensure your production site has a valid SSL certificate (HTTPS) as both Google and Facebook require secure connections for OAuth.

## How Social Authentication Works

### Registration Flow:
1. User clicks "Sign up with Google/Facebook"
2. OAuth popup opens
3. User authorizes the app
4. Backend receives user info
5. New account created automatically with social provider data
6. User logged in with JWT tokens

### Login Flow:
1. User clicks "Sign in with Google/Facebook"
2. OAuth popup opens
3. User authorizes the app
4. Backend checks if user exists
5. If exists: logs user in
6. If doesn't exist: creates new account and logs in

### Database Storage:
- Users are stored with `googleId` or `facebookId`
- `authProvider` field indicates sign-up method
- Email is used to link accounts if user signs up with different methods

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**: Check that your domains match in OAuth settings
2. **"Invalid app_id"**: Verify Facebook App ID is correct
3. **"Invalid client_id"**: Verify Google Client ID is correct
4. **CORS errors**: Ensure domains are properly configured in OAuth consoles
5. **SSL required**: Facebook/Google require HTTPS in production

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are loaded
3. Test with simple domains first (localhost)
4. Check OAuth app settings in respective consoles
5. Ensure APIs are enabled in Google Cloud Console

## Security Notes

1. **Never expose Client Secrets** in frontend code
2. **Validate tokens** on the backend
3. **Use HTTPS** in production
4. **Review app permissions** regularly
5. **Monitor usage** in OAuth consoles

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Test with a fresh incognito/private browser window
4. Check OAuth app status in respective developer consoles
