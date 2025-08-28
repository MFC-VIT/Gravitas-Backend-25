const { check } = require('express-validator');

const allowedRoles = ['user', 'admin'];

exports.registerValidation = [
  check('username', 'Username is required').trim().notEmpty(),
  check('email', 'Valid email is required').isEmail(),
  check('password', 'Password of min 6 chars is required').isLength({ min: 6 }),
  check('role', 'Role must be one of: user, admin').isIn(allowedRoles),
];

exports.loginValidation = [
  check('email', 'Valid email is required').isEmail(),
  check('password', 'Password is required').notEmpty(),
];
