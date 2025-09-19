const express = require('express');
const router = express.Router();
const {
  signupUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} = require('../controllers/auth.controller.js');

const validateToken = require('../../middleware/validateTokenHandler');
const validateAdmin = require('../../middleware/validateAdminHandler');

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

router.get('/profile', validateToken, (req, res) => {
  res.json({ message: 'Welcome!', user: req.user });
});

router.get('/admin', validateToken, validateAdmin, (req, res) => {
  res.json({ message: 'Hello Admin!', user: req.user });
});

module.exports = router;
