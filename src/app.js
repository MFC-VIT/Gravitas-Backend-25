const express = require('express');
const dotenv = require('dotenv');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');
const limiter = require('./utils/rate-limiter');
const cookieParser=require("cookie-parser");
dotenv.config();

const app = express();

app.use(cookieParser());
app.use(pinoHttp({ logger }));

app.use(express.json());
app.use(limiter);

app.use('/health', require('./routes/health.route'));
app.use('/auth', require('./routes/auth.route'));

module.exports = app;
