import winston from 'winston';
import config from '../config/env.js';

const { combine, timestamp, printf, colorize, align } = winston.format;

// Define log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  const ts = timestamp.slice(0, 19).replace('T', ' ');
  const log = `${ts} [${level}]: ${stack || message}`;
  return log;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    align(),
    logFormat
  ),
  transports: [
    // Write all logs with importance level of 'error' or less to 'error.log'
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to 'combined.log'
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  exitOnError: false // Don't exit on handled exceptions
});

// If we're not in production, log to the console as well
if (config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      align(),
      logFormat
    )
  }));
}

// Create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

export default logger;
