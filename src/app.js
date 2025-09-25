const express = require('express');
const dotenv = require('dotenv');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const limiter = require('./utils/rate-limiter');
const jeopardyadmin = require('../jeopardy/routes/admin.routes.js');
const jeopardyplayer = require('../jeopardy/routes/player.routes.js');
const scotlandyardplayer = require('../scotland-yard/routes/player.route.js');
const scotlandyardadmin = require('../scotland-yard/routes/admin.route.js');

const teamRoutes = require('./routes/team.route');
const swaggerDocs = require('./config/swagger.js');

dotenv.config();

const app = express();
const enablePino =
  process.env.NODE_ENV !== 'production' &&
  process.env.DISABLE_PINO !== 'true' &&
  process.env.DISABLE_LOGS !== 'true';
if (enablePino) {
  app.use(pinoHttp({ logger }));
}

// app.use(pinoHttp({ logger }));

app.use(express.json());
app.use(limiter);

app.use('/health', require('./routes/health.route'));
app.use('/auth', require('./routes/auth.route'));

app.use('/teams', teamRoutes);

app.use('/scotland/player', scotlandyardplayer);
app.use('/scotland/admin', scotlandyardadmin);
app.use('/jeopardy/admin', jeopardyadmin);
app.use('/jeopardy/player', jeopardyplayer);

swaggerDocs(app);

module.exports = app;
