const app = require('./app');
const logger = require('./utils/logger');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3000;

let server;

if (require.main === module) {
  server = app.listen(PORT, () => {
    logger.info(`Server running at ${PORT}`);
  });

  const shutdown = (signal) => {
    logger.info({ signal }, 'Graceful shutdown initiated');
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => {
        logger.warn('Forcing shutdown after timeout');
        process.exit(1);
      }, 5000).unref();
    } else {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = app;
