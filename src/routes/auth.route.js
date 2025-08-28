const express = require("express");
const router = express.Router();
const {
  signupUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCsrfToken, // Import the CSRF token controller
} = require("../controllers/authController");

const validateToken = require("../../middleware/validateTokenHandler");
const validateAdmin = require("../../middleware/validateAdminHandler");
const { validateCsrfToken } = require("../../middleware/validateCsrfToken");

// Add CSRF token endpoint
router.get("/csrf-token", getCsrfToken);

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/refresh", validateCsrfToken, refreshAccessToken);
router.post("/logout", validateToken, validateCsrfToken, logoutUser);

router.get("/profile", validateToken, (req, res) => {
  res.json({ message: "Welcome!", user: req.user });
});

router.get("/admin", validateToken, validateAdmin, (req, res) => {
  res.json({ message: "Hello Admin!", user: req.user });
});

module.exports = router;
