const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.VITE_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { clerkMiddleware } = require('@clerk/express');
const connectDB = require('./db');
const deviceRoutes = require('./routes/devices');
const logRoutes = require('./routes/logs');
const logger = require('./logger');

const app = express();

// ---------------------------------------------------------------------------
// HTTP request logging — writes to logs/app-YYYY-MM-DD.log
// Runs BEFORE Clerk so we still log unauthenticated requests.
// ---------------------------------------------------------------------------
morgan.token('user', (req) => req.auth?.userId || 'anonymous');
morgan.token('org', (req) => req.auth?.orgId || 'no-org');

app.use(
  morgan(':method :url :status :response-time ms user=:user org=:org', {
    stream: { write: (msg) => logger.info(`🖥️ ${msg.trim()}`) },
  })
);

// ---------------------------------------------------------------------------
// Global middleware (ORDER MATTERS)
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(
  clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  })
);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Public health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Frontend log ingestion — PUBLIC, must be before protected routes
app.use('/api/logs', logRoutes);

// Protected device routes (auth enforced inside devices.js)
app.use('/api/devices', deviceRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'IT Inventory System API is running!',
    endpoints: { devices: '/api/devices', logs: '/api/logs' },
  });
});

// ---------------------------------------------------------------------------
// Global error handler — logs to file with full context
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  logger.error('Unhandled request error', {
    message: err.message,
    path: req.path,
    method: req.method,
    userId: req.auth?.userId,
    orgId: req.auth?.orgId,
  });
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  logger.error(`❌ Startup failed: ${error.message}`);
  process.exit(1);
});