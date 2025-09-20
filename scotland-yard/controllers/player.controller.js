const supabase = require('../../src/config/supabase');

exports.viewTeam = async (req, res) => {
  const { userId } = req.params;

  try {
    // Step 1: Find team(s) for this user
    const { data: teamPlayers, error: teamPlayerError } = await supabase
      .from('TeamPlayer')
      .select('teamId')
      .eq('userId', userId);

    if (teamPlayerError || !teamPlayers || teamPlayers.length === 0) {
      return res.status(404).json({
        error: 'Team not found for user',
        details: teamPlayerError ? teamPlayerError.details : undefined,
      });
    }

    const teamId = teamPlayers[0].teamId;

    //Step2: Fetch team name
    const { data: teamData, error: nameerror } = await supabase
      .from('Team')
      .select('name, code, leaderId')
      .eq('id', teamId);

    if (nameerror) {
      console.error('Error fetching team name/code:', nameerror);
      return res.status(500).json({
        error: 'Error fetching team name/code',
        details: nameerror.details || nameerror.message || nameerror,
      });
    }

    const teamname = teamData && teamData[0] ? teamData[0].name : 'Unknown';
    const teamcode = teamData && teamData[0] ? teamData[0].code : 'Unknown';
    const teamleader =
      teamData && teamData[0] ? teamData[0].leaderId : 'Unknown';

    // Step 3: Fetch all players of that team
    const { data: allPlayers, error: allPlayersError } = await supabase
      .from('TeamPlayer')
      .select('userId')
      .eq('teamId', teamId);

    if (allPlayersError) {
      console.error('allPlayersError:', allPlayersError);
      return res.status(500).json({
        error: 'Error fetching team members',
        details: allPlayersError.details,
      });
    }

    const userIds = allPlayers.map((tp) => tp.userId);

    // Step 4: Get user details from correct table and column
    // Debug: Log userIds and check table/column names
    console.log('Fetching users with IDs:', userIds);

    const { data: users, error: usersError } = await supabase
      .from('User') // Use correct table name
      .select('*')
      .in('id', userIds); // Use correct column name

    if (usersError) {
      console.error('usersError:', usersError);
      return res.status(500).json({
        error: 'Error fetching user details',
        details: usersError.details,
        team: {
          teamId,
          members: userIds,
        },
      });
    }

    res.json({
      team: {
        teamId,
        members: userIds,
        teamname: teamname,
        teamcode: teamcode,
        teamleader: teamleader,
      },
      users,
    });
  } catch (error) {
    console.error('Error fetching team users:', error);
    res
      .status(500)
      .json({ error: 'Internal Server Error', details: error.message });
  }
};

//most likely will be seeded into DB, this will be the lobby creation, we won't require an endpoint for this
//keep this at a very low priority

exports.joinLobby = async (req, res) => {
  //from db, form the lobby, and keep ready for game start
};
exports.startGame = async (req, res) => {
  // Extract the userId from route parameters
  const { userId } = req.params;

  try {
    // Step 1: Find the team(s) that this user belongs to
    const { data: teamPlayers, error: teamPlayerError } = await supabase
      .from('TeamPlayer')
      .select('teamId')
      .eq('userId', userId);

    // If no team found, return 404
    if (teamPlayerError || !teamPlayers || teamPlayers.length === 0) {
      return res.status(404).json({
        error: 'Team not found for user',
        details: teamPlayerError ? teamPlayerError.details : undefined,
      });
    }

    // Step 2: Extract the teamId (note: column is 'teamId' in Supabase, not 'team_id')
    const teamId = teamPlayers[0].teamId;

    // Check if the user is the team leader
    const { data: teamData, error: teamDataError } = await supabase
      .from('Team')
      .select('leaderId')
      .eq('id', teamId)
      .single();

    if (teamDataError) {
      return res.status(500).json({
        error: 'Error fetching team leader information',
        details: teamDataError.message,
      });
    }

    const isLeader = teamData.leaderId === parseInt(userId);

    if (!isLeader) {
      // Return 403 Forbidden if the user is not the leader
      return res.status(403).json({
        error: 'You are not the team leader and cannot start the game',
      });
    }

    // Step 3: Check if the team is ready (isReadyScotland column)
    const { data: ready, error: StateError } = await supabase
      .from('Team')
      .select('isReadyScotland')
      .eq('id', teamId)
      .maybeSingle();

    if (StateError) {
      return res.status(500).json({
        error: 'Error in finding team ready state',
        details: StateError,
      });
    }

    if (!ready) {
      return res.status(404).json({ error: 'Team not found' });
    }

    console.log('TeamState: ', ready);

    // Step 4: Return the ready state and optionally proceed to form the game board
    res.json({
      message: 'Team ready state fetched successfully',
      team: {
        id: teamId,
        isReadyScotland: ready.isReadyScotland,
      },
    });

    // formGameBoard(lobbyId);
    //to be implemented next
    //work for next time I sit to code
    //uncomment top comment of this comment block, after formgameboard thingy is tested
  } catch (error) {
    console.error('Error fetching ready State of team:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message,
    });
  }
};

async function formGameBoard(lobbyId) {
  const supabase = require('../../src/config/supabase');

  //position all players on the gameboard, and return the gameboard details
  //get lobby ID, and fetch the gameboard details, update movehistory and gamestate (check schema from prisma.schema file),
  //set MR.X to 1, player turn to 1 (first player in team array), p2 to 2 and so on
  //gameboard has only nodes info and all that, common to all games
  //check karle movehistory aur gamestate mein kya update aur kahan karna hai, agar schema mein changes laane honge toh (try not to tho)

  // 1. Get all teams in the lobby
  // Find all teamIds in this lobby via TeamPlayer -> Lobby
  const { data: teamPlayers, error: tpErr } = await supabase
    .from('TeamPlayer')
    .select('teamId, userId, isLeader')
    .eq('isLeader', true);
  if (tpErr) throw tpErr;
  if (!teamPlayers || teamPlayers.length === 0)
    throw new Error('No team leaders found');

  // 2. Get all teams for these leaders
  const teamIds = teamPlayers.map((tp) => tp.teamId);
  const { data: teams, error: teamErr } = await supabase
    .from('Team')
    .select('id, leaderId')
    .in('id', teamIds);
  if (teamErr) throw teamErr;

  // 3. Filter only teams whose leader is in this lobby (by checking if leader is in teamPlayers)
  // (Assumes all leaders in teamPlayers are valid for this lobby)
  // 4. Place Mr.X first (first team leader), others follow
  const playerOrder = teamPlayers.map((tp, idx) => ({
    userId: tp.userId,
    teamId: tp.teamId,
    order: idx + 1,
    isMrX: idx === 0,
  }));

  // 5. Build stateJSON
  const stateJSON = {
    players: playerOrder,
    // add more game state fields as needed
  };

  // 6. Insert into GameState
  const { error: gsErr } = await supabase.from('GameState').insert([
    {
      lobbyId,
      stateJSON,
      currentTurnUserId: playerOrder[0].userId.toString(),
    },
  ]);
  if (gsErr) throw gsErr;

  return stateJSON;
}
exports.getMoveOptions = async (req, res) => {
  //based on the player position, return the possible move options
  //Logic: Check for the current current node
  //Go to the db check possible nodes for current node
  //Return Possible Nodes
};
exports.makeMove = async (req, res) => {
  //Logic: Requests Should have Chose =
  //update the player position in db, and return the updated gameboard details
  //Receive chosen node
  //Log Move details in Player/Team Details
  //Change Current Player to the next one
  //Let them Move
};
