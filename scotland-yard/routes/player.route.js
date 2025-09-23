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
 *     tags: [Player]
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
 *                       example: Avengers
 *                     teamcode:
 *                       type: string
 *                       example: TEAM123
 *                     teamleader:
 *                       type: integer
 *                       example: 101
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                   example:
 *                     - id: 101
 *                       username: "Tony"
 *                       email: "tony@avengers.com"
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
 *     tags: [Player]
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
 *                   example: Team ready state fetched successfully
 *                 team:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 12
 *                     isReadyScotland:
 *                       type: boolean
 *                       example: true
 *       403:
 *         description: User is not the team leader
 *       404:
 *         description: Team not found
 *       500:
 *         description: Internal server error
 */

router.get('/viewTeam/:userId', playerController.viewTeam);
router.get('/startGame/:userId', playerController.startGame);
router.get('/getMove', playerController.getMoveOptions);
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
