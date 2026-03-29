const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);

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
      callback(null, true); // Allow all in development
    }
  },
  credentials: true
}));

// Track feature availability
let bullBoardInitialized = false;
let redisEnabled = process.env.REDIS_ENABLED === 'true';

// Initialize BullMQ queue and Bull Board (lazy loading, only if Redis is enabled)
const initializeBullBoard = () => {
  if (bullBoardInitialized) return;
  if (!redisEnabled) {
    console.log('ℹ️ Bull Board disabled (set REDIS_ENABLED=true to enable)');
    return;
  }

  try {
    const { isQueueAvailable, getSyncQueue } = require('./queues/syncQueue');

    if (!isQueueAvailable()) {
      console.log('ℹ️ Bull Board disabled (queue not available)');
      return;
    }

    const { createBullBoard } = require('@bull-board/api');
    const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
    const { ExpressAdapter } = require('@bull-board/express');

    const syncQueue = getSyncQueue();
    if (!syncQueue) {
      console.log('ℹ️ Bull Board disabled (queue not initialized)');
      return;
    }

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [new BullMQAdapter(syncQueue)],
      serverAdapter
    });

    // Mount Bull Board at /admin/queues
    app.use('/admin/queues', serverAdapter.getRouter());

    bullBoardInitialized = true;
    console.log('✅ Bull Board initialized at /admin/queues');
  } catch (error) {
    console.warn('⚠️ Bull Board initialization skipped:', error.message);
  }
};

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    features: {
      bullBoard: bullBoardInitialized,
      redis: redisEnabled,
      syncMode: redisEnabled ? 'queue' : 'direct'
    }
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
  app.use('/api/societies', require('./routes/societyRoutes'));
  app.use('/api/notifications', require('./routes/notificationRoutes'));

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

// Export the initialization function
app.initializeBullBoard = initializeBullBoard;

module.exports = app;
