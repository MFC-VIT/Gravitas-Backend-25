const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 'error',
    message: 'Too many requests, try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;
