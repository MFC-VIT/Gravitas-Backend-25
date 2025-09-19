const express = require('express');
const router = express.Router();

const playerController = require('../controllers/player.controller');
const validateToken = require('../../middleware/validateTokenHandler');
const validateAdmin = require('../../middleware/validateAdminHandler');

// GET /viewTeam/:userId
router.get('/viewTeam/:userId', playerController.viewTeam);
router.get('/startGame/:userId', playerController.startGame);

module.exports = router;

// const express = require('express');
// const router = express.Router();

// const {
//   signupUser,
//   loginUser,
//   refreshAccessToken,
//   logoutUser,
// } = require('../controllers/auth.controller.js');

// const validateToken = require('../../middleware/validateTokenHandler');
// const validateAdmin = require('../../middleware/validateAdminHandler');

// const playerController = require('../controllers/player.controller.js');

// router.post('/viewTeam', playerController.viewTeam);

// router.get('/viewTeam', validateToken, (req, res) => {
//   res.json({ message: 'Team details fetched successfully!', user: req.user });
// });

// module.exports = router;
