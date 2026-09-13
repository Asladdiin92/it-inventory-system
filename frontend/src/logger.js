const LOG_ENDPOINT = 'http://localhost:3000/api/logs';

// Buffer to avoid flooding backend on rapid logs
let queue = [];
let flushTimer = null;

const flush = async () => {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];

  // Send each entry (or batch in future)
  for (const entry of batch) {
    try {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (e) {
      // Silent fail — don't crash app if logging endpoint is down
      console.warn('Log send failed', e);
    }
  }
};

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 500); // batch for 500ms
};

const log = (level, message, context = {}) => {
  // Always log to browser console for dev
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  consoleFn(`[${level.toUpperCase()}] ${message}`, context);

  queue.push({
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  });
  scheduleFlush();
};

export const logger = {
  info: (msg, ctx) => log('info', msg, ctx),
  warn: (msg, ctx) => log('warn', msg, ctx),
  error: (msg, ctx) => log('error', msg, ctx),
};