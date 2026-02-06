const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// CORS configuration - allow multiple origins for development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all in development
    }
  },
  credentials: true
}));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
try {
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/platforms', require('./routes/platformRoutes'));
  app.use('/api/rooms', require('./routes/roomRoutes'));
  app.use('/api/analytics', require('./routes/analyticsRoutes'));
  app.use('/api/dashboard', require('./routes/dashboardRoutes'));
  app.use('/api/compare', require('./routes/comparisonRoutes'));
  app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
  app.use('/api/sheets', require('./routes/sheetRoutes'));
  app.use('/api/daily-challenge', require('./routes/dailyChallengeRoutes'));
  app.use('/api/contests', require('./routes/contestRoutes'));
  app.use('/api/hosted-contests', require('./routes/hostedContestRoutes'));
  app.use('/api/problem-set', require('./routes/problemSetRoutes'));
  
  // Run code endpoint (live compiler)
  const { protect } = require('./middleware/auth');
  const submissionController = require('./controllers/submissionController');
  app.post('/api/run-code', protect, submissionController.runCode);
  
  // Submission status endpoint
  app.get('/api/submissions/:submissionId', protect, submissionController.getSubmission);
  
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;
