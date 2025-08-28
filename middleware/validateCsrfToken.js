const { doubleCsrf } = require("csurf-csrf");
const csrfSecret = process.env.CSRF_SECRET;

//CSRF protection Configuration
const {
  invalidCsrfTokenError,
  generateToken,
  validateRequest,
} = doubleCsrf({
  getSecret: () => csrfSecret,
  cookieName: "x-csrf-token",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production", // Set to true in production
    httpOnly: true,
    sameSite: "lax",
  },
});

// Single middleware for CSRF validation
const validateCsrfToken = (req, res, next) => {
  try {
    validateRequest(req, res);
    next();
  } catch (err) {
    if (err === invalidCsrfTokenError) {
      res.status(403).json({
        error: "CSRF token validation failed. Request rejected.",
      });
    } else {
      next(err);
    }
  }
};

module.exports = {
  generateToken,
  validateCsrfToken,
};