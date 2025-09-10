const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
  
  return { accessToken, refreshToken };
};

// @route   POST /api/auth/google
// @desc    Google OAuth authentication
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        status: 'error',
        message: 'Google credential is required'
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({
        status: 'error',
        message: 'Google email not verified'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update Google info if needed
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.profilePicture = picture;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        firstName: given_name || 'Google',
        lastName: family_name || 'User',
        email,
        password: Math.random().toString(36).slice(-8), // Random password (won't be used)
        googleId: payload.sub,
        profilePicture: picture,
        isEmailVerified: true,
        authProvider: 'google'
      });

      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      status: 'success',
      message: 'Google authentication successful',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Google authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/facebook
// @desc    Facebook OAuth authentication
// @access  Public
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken, userInfo } = req.body;

    if (!accessToken || !userInfo) {
      return res.status(400).json({
        status: 'error',
        message: 'Facebook access token and user info are required'
      });
    }

    // Verify Facebook token
    const fbResponse = await axios.get(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,email,first_name,last_name,picture`);
    
    if (fbResponse.data.id !== userInfo.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Facebook token'
      });
    }

    const { email, first_name, last_name, picture } = fbResponse.data;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email not provided by Facebook'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, update Facebook info if needed
      if (!user.facebookId) {
        user.facebookId = fbResponse.data.id;
        user.profilePicture = picture?.data?.url;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        firstName: first_name || 'Facebook',
        lastName: last_name || 'User',
        email,
        password: Math.random().toString(36).slice(-8), // Random password (won't be used)
        facebookId: fbResponse.data.id,
        profilePicture: picture?.data?.url,
        isEmailVerified: true,
        authProvider: 'facebook'
      });

      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken: jwtAccessToken, refreshToken } = generateTokens(user._id);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      status: 'success',
      message: 'Facebook authentication successful',
      data: {
        user: userResponse,
        accessToken: jwtAccessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Facebook authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
