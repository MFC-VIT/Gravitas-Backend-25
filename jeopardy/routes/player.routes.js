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
 * @openapi
 * /jeopardy/player/teampoints:
 *   post:
 *     summary: Get the score for a specific team
 *     tags:
 *       - Jeopardy - Player
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamId:
 *                 type: string
 *                 format: uuid
 *                 description: The unique ID of the team
 *             required:
 *               - teamId
 *     responses:
 *       200:
 *         description: Team score fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Team score fetched successfully
 *                 team:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "0e78a556-86dc-458f-9742-b1345177ce2b"
 *                     name:
 *                       type: string
 *                       example: Team5
 *                     teamPoints:
 *                       type: integer
 *                       example: 2000
 *                     code:
 *                       type: string
 *                       example: FXNLXC
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Team not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Something went wrong
 */

router.post('/teampoints', playerControllers.getTeamScore);
router.post('/get-attempted', playerControllers.getAttemptedQuestions);
module.exports = router;
