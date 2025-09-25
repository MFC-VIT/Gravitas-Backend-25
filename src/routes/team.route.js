const express = require('express');
const router = express.Router();
const validateToken = require('../../middleware/validateTokenHandler');
const controller = require('../controllers/team.controller');

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Team management APIs - create, join, leave, transfer leadership, manage members
 */

/**
 * @swagger
 * /team/create:
 *   post:
 *     summary: Create a new team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Avengers
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Team created successfully
 *                 team:
 *                   $ref: '#/components/schemas/Team'
 *                 code:
 *                   type: string
 *                   example: ABC123
 *       400:
 *         description: Team name required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /team/join:
 *   post:
 *     summary: Join an existing team with a code
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: ABC123
 *     responses:
 *       200:
 *         description: Joined team successfully
 *       400:
 *         description: Team code required / Already in team
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /team/leave:
 *   post:
 *     summary: Leave a team (deletes team if empty or transfers leadership if leader)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamId
 *             properties:
 *               teamId:
 *                 type: string
 *                 example: 123
 *     responses:
 *       200:
 *         description: Left team successfully
 *       404:
 *         description: Not a member
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /team/members:
 *   get:
 *     summary: Get all members of a team
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         example: 123
 *     responses:
 *       200:
 *         description: Team members fetched
 *       400:
 *         description: teamId required
 *       404:
 *         description: Team not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /team/transfer:
 *   post:
 *     summary: Transfer leadership to another member
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamId
 *               - newLeaderId
 *             properties:
 *               teamId:
 *                 type: string
 *                 example: 123
 *               newLeaderId:
 *                 type: string
 *                 example: 456
 *     responses:
 *       200:
 *         description: Leadership transferred
 *       400:
 *         description: teamId & newLeaderId required
 *       403:
 *         description: Only leader can transfer leadership
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /team/kick:
 *   post:
 *     summary: Kick a member from the team (leader only)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teamId
 *               - memberId
 *             properties:
 *               teamId:
 *                 type: string
 *                 example: 123
 *               memberId:
 *                 type: string
 *                 example: 789
 *     responses:
 *       200:
 *         description: Member removed
 *       400:
 *         description: Invalid request (e.g., trying to remove yourself)
 *       403:
 *         description: Only leader can kick members
 *       404:
 *         description: Team or user not found
 *       500:
 *         description: Server error
 */

router.use(validateToken);

router.post('/create', controller.createTeam);
router.post('/join', controller.joinTeam);
router.post('/leave', controller.leaveTeam);
router.get('/members', controller.listMembers);
router.post('/transfer', controller.transferLeadership);
router.post('/kick', controller.kickMember);

module.exports = router;
