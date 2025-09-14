const express = require('express');
const router = express.Router();
const lobbyController = require('../controllers/admin.controller.js');

router.post('/start', lobbyController.startGame);

module.exports = router;
