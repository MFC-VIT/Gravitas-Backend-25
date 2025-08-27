// middleware/validateAdminHandler.js
const jwt = require("jsonwebtoken");

const validateAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied: Admins only" });
  }

  next();
};

module.exports = validateAdmin;
