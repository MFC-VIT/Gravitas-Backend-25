const prisma = require('../config/db');
const redis = require('../config/redis');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

exports.healthCheck = async (req, res) => {
  const healthStatus = {
    timestamp: new Date().toISOString(),
    services: {
      db: 'unknown',
      redis: 'unknown',
    },
  };

  let statusCode = 200;

  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.db = 'up';
  } catch (err) {
    logger.error('Database health check failed:', err);
    healthStatus.services.db = 'down';
    statusCode = 500;
  }

  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      healthStatus.services.redis = 'up';
    } else {
      throw new Error('Unexpected Redis response');
    }
  } catch (err) {
    logger.error('Redis health check failed:', err);
    healthStatus.services.redis = 'down';
    statusCode = 500;
  }

  if (statusCode === 200) {
    return res.status(200).json({
      ...successResponse,
      message: 'Health check passed',
      data: healthStatus,
    });
  } else {
    return res.status(statusCode).json({
      ...errorResponse,
      message: 'Health check failed',
      error: healthStatus,
    });
  }
};
