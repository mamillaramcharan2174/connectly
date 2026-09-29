const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/responseFormatter');

// General API rate limiter: 300 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later.', 429);
  }
});

// Stricter rate limiter for authentication: 20 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 'AUTH_RATE_LIMIT_EXCEEDED', 'Too many authentication attempts, please wait 15 minutes.', 429);
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
