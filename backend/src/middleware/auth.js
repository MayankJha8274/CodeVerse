const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (Bearer <token>)
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password) with a 3-second explicit timeout
      const userPromise = User.findById(decoded.id).select('-password');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AUTH_TIMEOUT')), 3000)
      );

      req.user = await Promise.race([userPromise, timeoutPromise]);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is inactive'
        });
      }

      return next();
    } catch (error) {
      if (error && error.message === 'AUTH_TIMEOUT') {
        return res.status(504).json({
          success: false,
          message: '504 Gateway Timeout: Auth protect (User lookup stalled)'
        });
      }

      // Log non-expiration errors; expired tokens are expected and handled below
      if (!(error && error.name === 'TokenExpiredError')) {
        console.error('Auth middleware error:', error);
      }

      // Handle expired token explicitly so frontend can react (e.g. force re-login)
      if (error && error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, token expired',
          expiredAt: error.expiredAt
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token invalid but continue. Mark expiry so callers can handle if needed.
      if (error && error.name === 'TokenExpiredError') {
        req.user = null;
        req.tokenExpired = true;
      } else {
        req.user = null;
      }
    }
  }

  next();
};

module.exports = { protect, optionalAuth };
