const express = require('express');
const router = express.Router();
const logger = require('../logger');

// Public endpoint — frontend sends logs here before/after auth
router.post('/', (req, res) => {
  const { level = 'info', message, context, timestamp } = req.body;

  // Validate level to prevent log injection
  const allowed = ['info', 'warn', 'error'];
  const safeLevel = allowed.includes(level) ? level : 'info';

  // Truncate to prevent log flooding
  const safeMessage = String(message || '').slice(0, 2000);

  logger.log({
    level: safeLevel,
    message: `[FRONTEND] ${safeMessage}`,
    source: 'browser',
    clientTime: timestamp,
    ...(context || {}),
  });

  res.json({ success: true });
});

module.exports = router;