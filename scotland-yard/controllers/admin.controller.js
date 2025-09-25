// For admin controller - use the viewTeam function from player controller
const { viewTeam } = require('./player.controller');

// Export as viewTeamHandler for adminRoute.js
exports.viewTeamHandler = viewTeam;
