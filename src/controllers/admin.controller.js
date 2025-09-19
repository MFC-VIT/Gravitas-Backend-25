//commented because not in use

// const supabase = require('../../src/config/supabase');

// exports.viewTeam = async (req, res) => {
//   const { userId } = req.body;

//   try {
//     // Find the team_id for the given user
//     const { data: teamPlayers, error: teamPlayerError } = await supabase
//       .from('TeamPlayer')
//       .select('teamid')
//       .eq('userid', userId)
//       .single();

//     if (teamPlayerError || !teamPlayers) {
//       return res.status(404).json({ error: 'Team not found for user' });
//     }

//     const teamId = teamPlayers.team_id;

//     // Fetch all users from that team
//     const { data: allPlayers, error: allPlayersError } = await supabase
//       .from('teamplayer')
//       .select('userid')
//       .eq('teamid', teamId);

//     if (allPlayersError) {
//       throw allPlayersError;
//     }

//     // Get user details for all user IDs
//     const userIds = allPlayers.map((tp) => tp.user);

//     const { data: users, error: usersError } = await supabase
//       .from('User')
//       .select('*')
//       .in('id', userIds);

//     if (usersError) {
//       throw usersError;
//     }

//     res.json({ users });
//   } catch (error) {
//     console.error('Error fetching team users:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// // For admin controller
// const { viewTeam } = require('./player.controller');

// // Export as viewTeamHandler for adminRoute.js
// exports.viewTeamHandler = viewTeam;
