const express = require('express');
const router = express.Router();
const validateToken = require('../../middleware/validateTokenHandler');
const controller = require('../controllers/team.controller');

router.use(validateToken);

router.post('/create', controller.createTeam);
router.post('/join', controller.joinTeam);
router.post('/leave', controller.leaveTeam);
router.get('/members', controller.listMembers);
router.post('/transfer', controller.transferLeadership);
router.post('/kick', controller.kickMember);

module.exports = router;
