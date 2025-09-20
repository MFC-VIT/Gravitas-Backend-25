const express = require('express');
const router = express.Router();
const playerControllers = require('../controllers/player.controller');

/**
 * @openapi
 * /jeopardy/player/choose-question:
 *   post:
 *     summary: Choose a question for the team
 *     tags:
 *       - Jeopardy - Player
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - teamId
 *               - categoryId
 *               - difficulty
 *               - lobbyId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: "user123"
 *               teamId:
 *                 type: string
 *                 example: "team456"
 *               categoryId:
 *                 type: string
 *                 example: "cat789"
 *               difficulty:
 *                 type: string
 *                 example: "easy"
 *               lobbyId:
 *                 type: string
 *                 example: "lobby123"
 *     responses:
 *       201:
 *         description: Question chosen successfully
 *       400:
 *         description: Team already chose a question
 *       403:
 *         description: Only leader can choose or game not started
 *       404:
 *         description: Lobby or player not found
 *       500:
 *         description: Server error
 */
router.post('/choose-question', playerControllers.chooseQuestion);

/**
 * @openapi
 * /jeopardy/player/submit-answer:
 *   post:
 *     summary: Submit an answer to a chosen question
 *     tags:
 *       - Jeopardy - Player
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - teamId
 *               - questionId
 *               - selectedOption
 *               - lobbyId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: "user123"
 *               teamId:
 *                 type: string
 *                 example: "team456"
 *               questionId:
 *                 type: string
 *                 example: "q001"
 *               selectedOption:
 *                 type: string
 *                 example: "A"
 *               lobbyId:
 *                 type: string
 *                 example: "lobby123"
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *       400:
 *         description: Already answered or invalid attempt
 *       403:
 *         description: Player not found
 *       404:
 *         description: Question or team not found
 *       500:
 *         description: Server error
 */
router.post('/submit-answer', playerControllers.submitAnswer);

/**
 * @openapi
 * /jeopardy/player/scoreboard:
 *   get:
 *     summary: Get the current scoreboard
 *     tags:
 *       - Jeopardy - Player
 *     responses:
 *       200:
 *         description: Scoreboard fetched successfully
 *       500:
 *         description: Server error
 */
router.get('/scoreboard', playerControllers.getScoreboard);

module.exports = router;
