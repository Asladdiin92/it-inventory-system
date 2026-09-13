const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

const logDir = path.join(__dirname, '..', 'logs');

// Format for readability
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${stack ? `\n${stack}` : ''}${metaStr}`;
  })
);

// Rotating file for all logs (keeps 14 days)
const combinedFile = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  level: 'info',
});

// Rotating file for errors only
const errorFile = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  level: 'error',
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    combinedFile,
    errorFile,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
  ],
});

module.exports = logger;