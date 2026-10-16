const rateLimit = require('express-rate-limit');

// General API rate limiter (300 requests per 15 minutes window)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

// Strict authentication limiter (15 requests per 15 minutes window to prevent brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
