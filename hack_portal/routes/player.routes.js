const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller.js');

const validateToken = require('../../middleware/validateTokenHandler');
//const validateAdmin = require('../../middleware/validateAdminHandler');

router.post('/ideaSubmission', validateToken, playerController.ideaSubmission);
router.post(
  '/finalSubmission',
  validateToken,
  playerController.finalSubmission
);

module.exports = router;
