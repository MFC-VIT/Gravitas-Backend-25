const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const validateToken = require('../../middleware/validateTokenHandler');
const validateAdmin = require('../../middleware/validateAdminHandler');

router.post(
  '/initialsubmission',
  validateToken,
  validateAdmin,
  adminController.getAllInitialSubmissions
);
router.post(
  '/finalsubmission',
  validateToken,
  validateAdmin,
  adminController.getAllFinalSubmissions
);

module.exports = router;
