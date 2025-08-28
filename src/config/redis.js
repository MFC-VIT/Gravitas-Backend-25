const Redis = require('ioredis');
const logger = require('../utils/logger');
const redis = new Redis(process.env.REDIS_URL);
logger.info(process.env.REDIS_URL);

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis Error:', err));

module.exports = redis;
