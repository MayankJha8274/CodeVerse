require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const { startCronJobs } = require('./services/cronService');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start cron jobs for auto-sync
if (process.env.NODE_ENV === 'production') {
  startCronJobs();
  console.log('✅ Auto-sync cron jobs enabled');
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
