const express = require('express');
const dotenv = require('dotenv');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const limiter = require('./utils/rate-limiter');
const jeopardyadmin = require('../jeopardy/routes/admin.routes.js');
const jeopardyplayer = require('../jeopardy/routes/player.routes.js');
const teamRoutes = require('./routes/team.route');

dotenv.config();

const app = express();

app.use(pinoHttp({ logger }));

app.use(express.json());
app.use(limiter);

app.use('/health', require('./routes/health.route'));
app.use('/auth', require('./routes/auth.route'));
app.use('/teams', teamRoutes);

app.use('/jeopardy/admin', jeopardyadmin);
app.use('/jeopardy/player', jeopardyplayer);

// (Removed express-oas-generator due to incompatibility with Express 5 stack format)

module.exports = app;
