const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino(
  isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}
);

module.exports = logger;
