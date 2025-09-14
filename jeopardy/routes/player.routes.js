const express = require('express');
const router = express.Router();
const playerControllers = require('../controllers/player.controller');

router.post('/choose-question', playerControllers.chooseQuestion);
router.post('/submit-answer', playerControllers.submitAnswer);
router.get('/scoreboard', playerControllers.getScoreboard);

module.exports = router;
