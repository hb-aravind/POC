const rateLimit = require('express-rate-limit');

const defaultLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 15 minutes
  max: 50,
  handler(req, res) {
    return res.status(429).send({ success: false, message: 'Too many requests' });
  },
});

export default defaultLimiter;
