const express = require("express");
const csrf = require('csurf');
const router = express.Router();
const {
  signupUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCsrfToken,

} = require("../controllers/authController");
const csrfProtection =require("../../middleware/validateCsrfHandler")
const validateToken = require("../../middleware/validateTokenHandler");
const validateAdmin = require("../../middleware/validateAdminHandler");

router.get("/csrf-token",csrfProtection,getCsrfToken);
router.post("/signup",csrfProtection, signupUser);
router.post("/login", csrfProtection, loginUser);
router.post("/refresh",csrfProtection, refreshAccessToken);
router.post("/logout", csrfProtection, validateToken, logoutUser);

router.get("/profile", validateToken, (req, res) => {
  res.json({ message: "Welcome!", user: req.user });
});

router.get("/admin", validateToken, validateAdmin, (req, res) => {
  res.json({ message: "Hello Admin!", user: req.user });
});

module.exports = router;
