const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  uploadAvatar,
  updateSettings
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Multer configuration for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.post('/register', register);
router.post('/login', login);

// Check if OAuth is configured
const isGoogleOAuthConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const isGitHubOAuthConfigured = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

// Middleware to check OAuth availability
const oauthNotConfigured = (provider) => (req, res) => {
  res.status(501).json({
    success: false,
    message: `${provider} OAuth is not configured. Please set up ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET environment variables.`
  });
};

// Google OAuth routes
if (isGoogleOAuthConfigured) {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );

  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed` }),
    (req, res) => {
      // Generate JWT token
      const token = req.user.generateAuthToken();
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth-success?token=${token}`);
    }
  );
} else {
  router.get('/google', oauthNotConfigured('Google'));
  router.get('/google/callback', oauthNotConfigured('Google'));
}

// GitHub OAuth routes
if (isGitHubOAuthConfigured) {
  router.get('/github',
    passport.authenticate('github', { scope: ['user:email'], session: false })
  );

  router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed` }),
    (req, res) => {
      // Generate JWT token
      const token = req.user.generateAuthToken();
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/oauth-success?token=${token}`);
    }
  );
} else {
  router.get('/github', oauthNotConfigured('GitHub'));
  router.get('/github/callback', oauthNotConfigured('GitHub'));
}

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.put('/settings', protect, updateSettings);

module.exports = router;
