const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // User exists, update OAuth info
            user.oauthProvider = 'google';
            user.oauthId = profile.id;
            // Ensure fullName exists
            if (!user.fullName) {
              user.fullName = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || profile.emails[0].value.split('@')[0];
            }
            await user.save();
            return done(null, user);
          }

          // Derive a full name from the profile if available
          const derivedFullName = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || profile.emails[0].value.split('@')[0];

          // Create new user
          user = await User.create({
            username: profile.displayName || profile.emails[0].value.split('@')[0],
            fullName: derivedFullName,
            email: profile.emails[0].value,
            password: Math.random().toString(36).slice(-8), // Random password (won't be used)
            oauthProvider: 'google',
            oauthId: profile.id,
            isActive: true
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: '/api/auth/github/callback',
        scope: ['user:email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.com`;

          // Check if user already exists
          let user = await User.findOne({ email });

          if (user) {
            // User exists, update OAuth info
            user.oauthProvider = 'github';
            user.oauthId = profile.id;
            // Auto-link GitHub platform
            if (!user.platforms.github) {
              user.platforms.github = profile.username;
            }
            // Ensure fullName exists
            if (!user.fullName) {
              user.fullName = profile.displayName || profile.username || email.split('@')[0];
            }
            await user.save();
            return done(null, user);
          }

          // Derive a full name for GitHub profile
          const ghFullName = profile.displayName || profile.username || email.split('@')[0];

          // Create new user
          user = await User.create({
            username: profile.username || profile.displayName || email.split('@')[0],
            fullName: ghFullName,
            email,
            password: Math.random().toString(36).slice(-8), // Random password (won't be used)
            oauthProvider: 'github',
            oauthId: profile.id,
            platforms: {
              github: profile.username
            },
            isActive: true
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

module.exports = passport;
