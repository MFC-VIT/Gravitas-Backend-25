const express = require('express');
const router = express.Router();
const lobbyController = require('../controllers/admin.controller.js');

/**
 * @openapi
 * /jeopardy/admin/start:
 *   post:
 *     summary: Start a new Jeopardy game
 *     tags:
 *       - Jeopardy - Admin
 *     responses:
 *       201:
 *         description: Game started successfully
 *       500:
 *         description: Server error
 */
router.post('/start', lobbyController.startGame);

module.exports = router;
