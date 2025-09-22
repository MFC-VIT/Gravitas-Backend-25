const express = require('express');
const router = express.Router();
const { viewTeamHandler } = require('../controllers/admin.controller');

router.post('/viewTeam', viewTeamHandler);

module.exports = router;
