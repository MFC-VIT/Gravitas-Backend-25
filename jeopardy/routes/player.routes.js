const express = require('express');
const router = express.Router();
const playerControllers = require('../controllers/player.controller');
const validateToken = require('../../middleware/validateTokenHandler');

/**
 * @swagger
 * tags:
 *   name: Jeopardy - Player
 *   description: Jeopardy player APIs
 */

/**
 * @swagger
 * /jeopardy/player/choose-question:
 *   post:
 *     summary: Choose a question for the team
 *     tags: [Jeopardy - Player]
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
 *                 example: 123
 *                 description: ID of the user choosing the question
 *               teamId:
 *                 type: string
 *                 example: "team-uuid-456"
 *                 description: ID of the team
 *               categoryId:
 *                 type: string
 *                 example: "cat-uuid-789"
 *                 description: ID of the question category
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard]
 *                 example: "easy"
 *                 description: Difficulty level of the question
 *               lobbyId:
 *                 type: string
 *                 example: "lobby-uuid-123"
 *                 description: ID of the game lobby
 *     responses:
 *       201:
 *         description: Question chosen successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Question chosen successfully
 *                 questionId:
 *                   type: string
 *                   example: "q001"
 *       400:
 *         description: Team already chose a question or invalid parameters
 *       403:
 *         description: Only team leader can choose or game not started
 *       404:
 *         description: Lobby or player not found
 *       500:
 *         description: Server error
 */
router.post(
  '/choose-question',
  validateToken,
  playerControllers.chooseQuestion
);

/**
 * @swagger
 * /jeopardy/player/submit-answer:
 *   post:
 *     summary: Submit an answer to a chosen question
 *     tags: [Jeopardy - Player]
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
 *                 example: 123
 *                 description: ID of the user submitting the answer
 *               teamId:
 *                 type: string
 *                 example: "team-uuid-456"
 *                 description: ID of the team
 *               questionId:
 *                 type: string
 *                 example: "q001"
 *                 description: ID of the question being answered
 *               selectedOption:
 *                 type: string
 *                 enum: [A, B, C, D]
 *                 example: "A"
 *                 description: Selected answer option (A, B, C, or D)
 *               lobbyId:
 *                 type: string
 *                 example: "lobby-uuid-123"
 *                 description: ID of the game lobby
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Answer submitted successfully
 *                 correct:
 *                   type: boolean
 *                   example: true
 *                 points:
 *                   type: integer
 *                   example: 100
 *       400:
 *         description: Already answered or invalid attempt
 *       403:
 *         description: Player not authorized
 *       404:
 *         description: Question or team not found
 *       500:
 *         description: Server error
 */
router.post('/submit-answer', validateToken, playerControllers.submitAnswer);

/**
 * @swagger
 * /jeopardy/player/scoreboard:
 *   get:
 *     summary: Get the current scoreboard
 *     tags: [Jeopardy - Player]
 *     parameters:
 *       - in: query
 *         name: lobbyId
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional lobby ID to get specific game scoreboard
 *         example: "lobby-uuid-123"
 *     responses:
 *       200:
 *         description: Scoreboard fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scoreboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       teamId:
 *                         type: string
 *                         example: "team-uuid-456"
 *                       teamName:
 *                         type: string
 *                         example: "Avengers"
 *                       score:
 *                         type: integer
 *                         example: 350
 *                       rank:
 *                         type: integer
 *                         example: 1
 *       500:
 *         description: Server error
 */
router.get('/scoreboard', validateToken, playerControllers.getScoreboard);
router.get('/teampoints', validateToken, playerControllers.getTeamScore);
module.exports = router;
