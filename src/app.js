const express = require('express');
const dotenv = require('dotenv');
const limiter = require('./utils/rate-limiter');

dotenv.config();

const app = express();

app.use(express.json());
app.use(limiter);

app.use('/health', require('./routes/health.route'));

module.exports = app;
