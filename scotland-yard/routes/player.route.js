const express = require('express');
const router = express.Router();

const playerController = require('../controllers/player.controller');
const validateToken = require('../../middleware/validateTokenHandler');
const validateAdmin = require('../../middleware/validateAdminHandler');

/**
 * @swagger
 * /scotland/player/viewTeam/{userId}:
 *   get:
 *     summary: Get a player's team details
 *     tags: [Scotland Yard - Player]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: Successfully fetched team details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 team:
 *                   type: object
 *                   properties:
 *                     teamId:
 *                       type: integer
 *                       example: 12
 *                     members:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [101, 102, 103]
 *                     teamname:
 *                       type: string
 *                       example: "Avengers"
 *                     teamcode:
 *                       type: string
 *                       example: "TEAM123"
 *                     teamleader:
 *                       type: integer
 *                       example: 101
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 101
 *                       username:
 *                         type: string
 *                         example: "Tony"
 *                       email:
 *                         type: string
 *                         example: "tony@avengers.com"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Team not found for user
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /scotland/player/startGame/{userId}:
 *   get:
 *     summary: Start the game if user is team leader
 *     tags: [Scotland Yard - Player]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user
 *     responses:
 *       200:
 *         description: Game start status fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All teams are ready. Game board formed.
 *                 team:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12
 *                     previousIsReady:
 *                       type: boolean
 *                       example: false
 *                     currentIsReady:
 *                       type: boolean
 *                       example: true
 *                 lobbyId:
 *                   type: string
 *                   example: "lobby-uuid-123"
 *       400:
 *         description: Invalid userId parameter or no teams found
 *       403:
 *         description: User is not the team leader
 *       404:
 *         description: Team not found or lobby not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /scotland/player/getMove:
 *   post:
 *     summary: Get possible move options for the current player
 *     tags: [Scotland Yard - Player]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - lobbyId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "1"
 *               lobbyId:
 *                 type: string
 *                 example: "6d8e0c0d-b59c-4f45-8431-cc356349ff5c"
 *     responses:
 *       200:
 *         description: Move options fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 moveOptions:
 *                   type: object
 *                   properties:
 *                     buses:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [46, 58]
 *                     subways:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [46]
 *                     taxies:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [8, 9]
 *       403:
 *         description: Not your turn
 *       404:
 *         description: Game state not found or player position not found
 *       500:
 *         description: Error fetching game state or node data
 */

/**
 * @swagger
 * /scotland/player/makeMove:
 *   post:
 *     summary: Make a move to a chosen node
 *     tags: [Scotland Yard - Player]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - lobbyId
 *               - chosenNode
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "1"
 *               lobbyId:
 *                 type: string
 *                 example: "6d8e0c0d-b59c-4f45-8431-cc356349ff5c"
 *               chosenNode:
 *                 type: string
 *                 example: "8"
 *     responses:
 *       200:
 *         description: Move made successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Move made successfully
 *       400:
 *         description: Invalid move or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid move - chosen node is not a valid option
 *                 chosenNode:
 *                   type: string
 *                   example: "8"
 *                 possibleNodes:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [46, 58, 8, 9]
 *                 userId:
 *                   type: string
 *                   example: "1"
 *                 lobbyId:
 *                   type: string
 *                   example: "6d8e0c0d-b59c-4f45-8431-cc356349ff5c"
 *       403:
 *         description: Not your turn or not a team leader
 *       404:
 *         description: Game state not found or player not found
 *       500:
 *         description: Internal server error
 */

router.get('/viewTeam/:userId', playerController.viewTeam);
router.get('/startGame/:userId', playerController.startGame);
router.post('/getMove', playerController.getMoveOptions);
router.post('/makeMove', playerController.makeMove);

module.exports = router;

// const express = require('express');
// const router = express.Router();

// const {
//   signupUser,
//   loginUser,
//   refreshAccessToken,
//   logoutUser,
// } = require('../controllers/auth.controller.js');

// const validateToken = require('../../middleware/validateTokenHandler');
// const validateAdmin = require('../../middleware/validateAdminHandler');

// const playerController = require('../controllers/player.controller.js');

// router.post('/viewTeam', playerController.viewTeam);

// router.get('/viewTeam', validateToken, (req, res) => {
//   res.json({ message: 'Team details fetched successfully!', user: req.user });
// });

// module.exports = router;
