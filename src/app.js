const express = require('express');
const dotenv = require('dotenv');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const limiter = require('./utils/rate-limiter');
//const jeopardyadmin = require('../jeopardy/routes/admin.routes.js');
const jeopardyplayer = require('../jeopardy/routes/player.routes.js');
const scotlandyardplayer = require('../scotland-yard/routes/player.route.js');
const scotlandyardadmin = require('../scotland-yard/routes/admin.route.js');
const hackathonplayer = require('../hack_portal/routes/player.routes.js');
const hackathonadmin = require('../hack_portal/routes/admin.routes.js');

const teamRoutes = require('./routes/team.route');
const swaggerDocs = require('./config/swagger.js');

// Fix CORS import - use the cors package directly
const cors = require('cors');

dotenv.config();

const app = express();

// Configure CORS properly
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      const allowedOrigins = ['*'];

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === 'development'
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

const enablePino =
  process.env.NODE_ENV !== 'production' &&
  process.env.DISABLE_PINO !== 'true' &&
  process.env.DISABLE_LOGS !== 'true';
if (enablePino) {
  app.use(pinoHttp({ logger }));
}

app.use(express.json());
//app.use(limiter);

app.use('/health', require('./routes/health.route'));
app.use('/auth', require('./routes/auth.route'));

app.use('/teams', teamRoutes);

app.use('/scotland/player', scotlandyardplayer);
app.use('/scotland/admin', scotlandyardadmin);
//app.use('/jeopardy/admin', jeopardyadmin);
app.use('/jeopardy/player', jeopardyplayer);
app.use('/hackathon/player', hackathonplayer);
app.use('/hackathon/admin', hackathonadmin);

swaggerDocs(app);

module.exports = app;
