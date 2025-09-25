const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';
const enabled = isDev && process.env.DISABLE_LOGS !== 'true';

const logger = pino(
  enabled
    ? {
        enabled: true,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : { enabled: false, level: 'silent' }
);

module.exports = logger;
