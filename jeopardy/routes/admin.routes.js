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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the admin starting the game
 *             required:
 *               - userId
 *     responses:
 *       201:
 *         description: Game started successfully
 *       500:
 *         description: Server error
 */
router.post('/start', lobbyController.startGame);

module.exports = router;
