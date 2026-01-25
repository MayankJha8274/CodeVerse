require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const { startAllCronJobs } = require('./services/cronService');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start cron jobs for auto-sync and weekly reports
if (process.env.NODE_ENV === 'production') {
  startAllCronJobs();
  console.log('✅ Auto-sync and weekly report cron jobs enabled');
} else {
  console.log('ℹ️  Cron jobs disabled in development mode');
  console.log('   Use POST /api/platforms/sync to manually sync data');
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
