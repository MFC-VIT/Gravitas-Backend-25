const express = require('express');
const router = express.Router();
const { viewTeamHandler } = require('../controllers/admin.controller');

/**
 * @swagger
 * tags:
 *   name: Scotland Yard - Admin
 *   description: Scotland Yard admin management APIs
 */

/**
 * @swagger
 * /scotland/admin/viewTeam:
 *   post:
 *     summary: View team details (Admin function)
 *     tags: [Scotland Yard - Admin]
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
 *                 example: 1
 *     responses:
 *       200:
 *         description: Team details fetched successfully
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
 *       404:
 *         description: Team not found for user
 *       500:
 *         description: Internal server error
 */
router.post('/viewTeam', viewTeamHandler);

module.exports = router;
