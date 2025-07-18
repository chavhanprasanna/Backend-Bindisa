import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import hpp from 'hpp';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import config from '../config/env.js';
import logger from '../utils/logger.js';

// Configure CORS
const configureCors = () => {
  const whitelist = [];

  // Add development origins
  if (config.NODE_ENV === 'development') {
    whitelist.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    );
  }

  // Add production origins
  if (config.CORS_ORIGIN) {
    if (Array.isArray(config.CORS_ORIGIN)) {
      whitelist.push(...config.CORS_ORIGIN);
    } else {
      whitelist.push(config.CORS_ORIGIN);
    }
  }

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Refresh-Token'
    ],
    exposedHeaders: ['Authorization', 'X-Refresh-Token'],
    credentials: true,
    maxAge: 600, // 10 minutes
    optionsSuccessStatus: 200
  };

  return cors(corsOptions);
};

// Configure Content Security Policy
const configureCSP = () => {
  const self = '\'self\'';
  const unsafeInline = '\'unsafe-inline\'';
  const unsafeEval = '\'unsafe-eval\'';
  const data = 'data:';
  const blob = 'blob:';

  // Default CSP configuration
  const cspConfig = {
    directives: {
      defaultSrc: [self],
      scriptSrc: [self, unsafeInline, unsafeEval],
      styleSrc: [self, unsafeInline, 'https://fonts.googleapis.com'],
      imgSrc: [self, data, blob, 'https:'],
      fontSrc: [self, 'https://fonts.gstatic.com', 'data:'],
      connectSrc: [self, 'https://api.example.com'],
      frameSrc: [self],
      objectSrc: ['\'none\''],
      mediaSrc: [self],
      childSrc: [self],
      formAction: [self],
      baseUri: [self],
      frameAncestors: ['\'none\''],
      blockAllMixedContent: [],
      upgradeInsecureRequests: []
    },
    reportOnly: config.NODE_ENV === 'development',
    browserSniff: false
  };

  return helmet.contentSecurityPolicy(cspConfig);
};

// Security headers middleware
const securityHeaders = [
  // Set security headers using helmet
  helmet({
    contentSecurityPolicy: false, // Disable default CSP, we'll set it manually
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true
  }),

  // Custom headers
  (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Enable XSS filtering in browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent content type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Disable caching for authenticated responses
    if (req.user) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }

    // Add security headers for API responses
    res.setHeader('X-Content-Security-Policy', 'default-src \'self\'');
    res.setHeader('X-WebKit-CSP', 'default-src \'self\'');

    next();
  },

  // Protect against HTTP Parameter Pollution attacks
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  }),

  // Sanitize data
  xss(),

  // Sanitize request data
  (req, res, next) => {
    // Sanitize request body
    if (req.body) {
      req.body = JSON.parse(JSON.stringify(req.body));
    }

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = req.query[key].replace(/[<>"'`]/g, '');
        }
      });
    }

    // Sanitize URL parameters
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = req.params[key].replace(/[<>"'`]/g, '');
        }
      });
    }

    next();
  },

  // Prevent NoSQL injection
  (req, res, next) => {
    // Remove $ and . from request body
    if (req.body) {
      const clean = (obj) => {
        Object.keys(obj).forEach(key => {
          if (obj[key] !== null && typeof obj[key] === 'object') {
            clean(obj[key]);
          } else if (key.includes('$') || key.includes('.')) {
            delete obj[key];
          }
        });
      };

      clean(req.body);
    }

    next();
  },

  // Log security events
  (req, res, next) => {
    // Log potential XSS attempts
    const xssRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const hasXSS = JSON.stringify(req.body).match(xssRegex) ||
                  JSON.stringify(req.query).match(xssRegex) ||
                  JSON.stringify(req.params).match(xssRegex);

    if (hasXSS) {
      logger.warn(`Potential XSS attack detected from IP: ${req.ip}`, {
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      });
    }

    // Log potential NoSQL injection attempts
    const nosqlRegex = /\$[a-zA-Z]+|\/\*.*\*\//;
    const hasNoSQL = JSON.stringify(req.body).match(nosqlRegex) ||
                    JSON.stringify(req.query).match(nosqlRegex) ||
                    JSON.stringify(req.params).match(nosqlRegex);

    if (hasNoSQL) {
      logger.warn(`Potential NoSQL injection attempt from IP: ${req.ip}`, {
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params
      });
    }

    next();
  }
];

// Export security middleware
const securityMiddleware = [
  configureCors(),
  configureCSP(),
  ...securityHeaders
];

export { securityMiddleware };

export default securityMiddleware;
