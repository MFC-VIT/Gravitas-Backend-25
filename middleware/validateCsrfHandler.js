const csrf = require('csurf');


const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,                  // Cannot be accessed by client-side JS
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
    sameSite: 'strict'               // Provides strong defense against CSRF
  } 
});

// Export the configured middleware so it can be used in your route files
module.exports = csrfProtection;
