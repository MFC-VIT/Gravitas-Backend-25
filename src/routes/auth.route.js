const express = require("express");
const router = express.Router();
const {
  signupUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} = require("../controllers/authController");

const validateToken = require("../../middleware/validateTokenHandler");
const validateAdmin = require("../../middleware/validateAdminHandler");
const { validateCsrfToken } = require("../../middleware/validateCsrfToken");
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
