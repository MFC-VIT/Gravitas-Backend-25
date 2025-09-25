const express = require('express');
const router = express.Router();
const lobbyController = require('../controllers/admin.controller.js');
const validateToken = require('../../middleware/validateTokenHandler');
const validateAdmin = require('../../middleware/validateAdminHandler');

/**
 * @swagger
 * tags:
 *   name: Jeopardy - Admin
 *   description: Jeopardy admin management APIs
 */

/**
 * @swagger
 * /jeopardy/admin/start:
 *   post:
 *     summary: Start a new Jeopardy game
 *     tags: [Jeopardy - Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the admin starting the game
 *                 example: 123
 *     responses:
 *       201:
 *         description: Game started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game started successfully
 *                 lobbyId:
 *                   type: string
 *                   example: "lobby-uuid-123"
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/start', validateToken, validateAdmin, lobbyController.startGame);

module.exports = router;
