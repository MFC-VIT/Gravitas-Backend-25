const prisma = require('../config/db');
const redis = require('../config/redis');
const { successResponse, errorResponse } = require('../utils/response');

exports.healthCheck = async (req, res) => {
  const healthStatus = {
    timestamp: new Date(),
    services: {
      db: 'unknown',
      redis: 'unknown',
    },
  };

  let status = 'success';

  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.db = 'up';
  } catch (err) {
    healthStatus.services.db = 'down';
    status = 'error';
  }

  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      healthStatus.services.redis = 'up';
    } else {
      throw new Error('Invalid Redis ping response');
    }
  } catch (err) {
    healthStatus.services.redis = 'down';
    status = 'error';
  }

  const code = status === 'success' ? 200 : 500;

  if (status === 'success') {
    return successResponse(res, healthStatus, 'Health check passed', code);
  } else {
    return errorResponse(res, healthStatus, 'Health check failed', code);
  }
};
