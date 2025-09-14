const express = require('express');
const dotenv = require('dotenv');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const limiter = require('./utils/rate-limiter');
const jeopardyadmin = require('../jeopardy/routes/admin.routes.js');
const jeopardyplayer = require('../jeopardy/routes/player.routes.js');

dotenv.config();

const app = express();

app.use(pinoHttp({ logger }));

app.use(express.json());
app.use(limiter);

app.use('/health', require('./routes/health.route'));
app.use('/auth', require('./routes/auth.route'));

app.use('/jeopardy/admin', jeopardyadmin);
app.use('/jeopardy/player', jeopardyplayer);

module.exports = app;
