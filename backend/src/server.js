require('dotenv').config();
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');
const { startAllCronJobs } = require('./services/cronService');
const { setupSocketIO } = require('./services/socketHandler');
const { exec } = require('child_process');
const net = require('net');

const PORT = process.env.PORT || 5000;

let server;

// Try to load optional dependencies
let setSocketIO, syncLogger, startWorker;
try {
  const syncWorker = require('./workers/syncWorker');
  setSocketIO = syncWorker.setSocketIO;
  startWorker = syncWorker.startWorker;
} catch (err) {
  setSocketIO = () => {}; // No-op if worker not available
  startWorker = null;
}

try {
  syncLogger = require('./services/loggerService').syncLogger;
} catch (err) {
  syncLogger = {
    info: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.log
  };
}

// Function to check if port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close();
      })
      .listen(port, '0.0.0.0');
  });
};

// Function to kill process on port (Windows)
const killProcessOnPort = (port) => {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      exec(`powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        () => {
          setTimeout(resolve, 1000); // Wait for port to be freed
        }
      );
    } else {
      exec(`lsof -ti:${port} | xargs kill -9`, () => {
        setTimeout(resolve, 1000);
      });
    }
  });
};

// Setup sync-specific socket events
const setupSyncSocketEvents = (io) => {
  io.on('connection', (socket) => {
    // Join user-specific room for sync updates
    socket.on('sync:subscribe', (userId) => {
      socket.join(`user:${userId}`);
      if (syncLogger.debug) syncLogger.debug('User subscribed to sync updates', { userId });
    });

    socket.on('sync:unsubscribe', (userId) => {
      socket.leave(`user:${userId}`);
    });
  });

  // Make io available to the worker (if available)
  if (setSocketIO) {
    try {
      setSocketIO(io);
    } catch (err) {
      // Worker not available
    }
  }
};

// Main startup function
const startServer = async () => {
  try {
    // Check if port is in use and kill the process
    const portInUse = await isPortInUse(PORT);
    if (portInUse) {
      console.log(`⚠️  Port ${PORT} is in use. Attempting to free it...`);
      await killProcessOnPort(PORT);
      console.log(`✅ Port ${PORT} freed successfully`);
    }

    // Connect to database first
    await connectDB();

    // Initialize Bull Board (after routes are loaded)
    if (app.initializeBullBoard) {
      try {
        app.initializeBullBoard();
      } catch (err) {
        console.warn('⚠️ Bull Board not available:', err.message);
      }
    }

    // Start background sync worker
    if (startWorker && process.env.REDIS_ENABLED === 'true') {
      console.log('🚀 Starting background Queue Sync Worker...');
      startWorker().catch(err => console.error('Worker failed to start:', err.message));
    }

    // Start cron jobs for auto-sync and weekly reports
    startAllCronJobs();
    console.log('✅ Auto-sync and weekly report cron jobs enabled');
    console.log('⏰ Platform sync runs every 15 minutes');
    console.log('   Manual sync available via "Sync All Platforms" button');

    // Create HTTP server and attach Socket.io
    const httpServer = http.createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          process.env.FRONTEND_URL,
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:3000'
        ].filter(Boolean),
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Setup Socket.io handlers
    setupSocketIO(io);
    setupSyncSocketEvents(io);
    console.log('✅ Socket.io initialized for real-time chat');

    // Start server
    server = httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`⏰ Server started at: ${new Date().toISOString()}`);
      console.log(`🔄 Keep this terminal open - press Ctrl+C to stop`);

      // Test the server immediately
      setTimeout(() => {
        const http = require('http');
        http.get(`http://localhost:${PORT}/health`, (res) => {
          console.log(`✅ Self-test successful: Health endpoint responding with status ${res.statusCode}`);
        }).on('error', (err) => {
          console.error(`❌ Self-test failed: ${err.message}`);
        });
      }, 1000);
    });

    server.on('error', async (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is still in use. Retrying...`);
        await killProcessOnPort(PORT);
        // Retry starting the server
        setTimeout(() => startServer(), 2000);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

    // Handle graceful shutdown for nodemon
    process.once('SIGUSR2', () => {
      console.log('🔄 Nodemon restart detected, closing server...');
      server.close(() => {
        console.log('✅ Server closed for restart');
        process.kill(process.pid, 'SIGUSR2');
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Rejection:', err);
      if (server) server.close(() => process.exit(1));
      else process.exit(1);
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM received, shutting down gracefully');
      if (server) {
        server.close(() => {
          console.log('Process terminated');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('\n👋 SIGINT received, shutting down gracefully');
      if (server) {
        server.close(() => {
          console.log('Process terminated');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
