const express = require('express');
const dotenv = require('dotenv');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const limiter = require('./utils/rate-limiter');
const jeopardyadmin = require('../jeopardy/routes/admin.routes.js');
const jeopardyplayer = require('../jeopardy/routes/player.routes.js');
const scotlandyardplayer = require('../scotland-yard/routes/player.route.js');
// const scotlandyardadmin = require('../scotland-yard/routes/admin.route.js');
const hackathonplayer = require('../hack_portal/routes/player.routes.js');
const hackathonadmin = require('../hack_portal/routes/admin.routes.js');

const teamRoutes = require('./routes/team.route');
const swaggerDocs = require('./config/swagger.js');

dotenv.config();

const app = express();

app.use(pinoHttp({ logger }));

app.use(express.json());
app.use(limiter);

app.use('/health', require('./routes/health.route'));
app.use('/auth', require('./routes/auth.route'));

app.use('/teams', teamRoutes);

app.use('/scotland/player', scotlandyardplayer);
app.use('/jeopardy/admin', jeopardyadmin);
app.use('/jeopardy/player', jeopardyplayer);
app.use('/hackathon/player', hackathonplayer);
app.use('/hackathon/admin', hackathonadmin);

// (Removed express-oas-generator due to incompatibility with Express 5 stack format)

// Swagger Docs
swaggerDocs(app);

module.exports = app;
