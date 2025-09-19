const express = require('express');
const router = express.Router();

const { healthCheck } = require('../controllers/health.controller');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check for database and Redis
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Health check passed
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-09-20T03:35:00.000Z
 *                     services:
 *                       type: object
 *                       properties:
 *                         db:
 *                           type: string
 *                           example: up
 *                         redis:
 *                           type: string
 *                           example: up
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Health check failed
 *                 error:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     services:
 *                       type: object
 *                       properties:
 *                         db:
 *                           type: string
 *                           example: down
 *                         redis:
 *                           type: string
 *                           example: down
 */
router.get('/', healthCheck);

module.exports = router;
