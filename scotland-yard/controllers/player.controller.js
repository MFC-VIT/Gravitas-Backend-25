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
  const { userId: userIdParam } = req.params;

  // Basic validation
  const userId = Number(userIdParam);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid userId parameter' });
  }

  try {
    // 1) Find the team(s) that this user belongs to
    const { data: teamPlayers, error: teamPlayerError } = await supabase
      .from('TeamPlayer')
      .select('teamId')
      .eq('userId', userId);

    if (teamPlayerError) {
      return res.status(500).json({
        error: 'Error fetching team membership',
        details: teamPlayerError.message,
      });
    }

    if (!teamPlayers || teamPlayers.length === 0) {
      return res.status(404).json({ error: 'Team not found for user' });
    }

    // If user can be in multiple teams, you may want to decide which team to pick.
    const teamId = teamPlayers[0].teamId;

    // 2) Fetch team row including leaderId and isReadyScotland (one query)
    const { data: teamRow, error: teamRowError } = await supabase
      .from('Team')
      .select('id, leaderId, isReadyScotland')
      .eq('id', teamId)
      .single();

    if (teamRowError) {
      return res.status(500).json({
        error: 'Error fetching team info',
        details: teamRowError.message,
      });
    }
    if (!teamRow) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const isLeader = teamRow.leaderId === userId;
    if (!isLeader) {
      return res.status(403).json({
        error: 'You are not the team leader and cannot start the game',
      });
    }

    // 3) Mark the team as ready if not already
    let updatedTeamRow = teamRow;
    if (!teamRow.isReadyScotland) {
      const { data: updatedTeam, error: updateError } = await supabase
        .from('Team')
        .update({ isReadyScotland: true, updatedAt: new Date().toISOString() })
        .eq('id', teamId)
        .select('id, leaderId, isReadyScotland')
        .single();

      if (updateError) {
        return res.status(500).json({
          error: 'Error updating team ready status',
          details: updateError.message,
        });
      }
      updatedTeamRow = updatedTeam;
    }

    // 4) Get the Lobby that contains this user (select all user columns we need)
    const { data: lobbyRow, error: lobbyError } = await supabase
      .from('Lobby')
      .select('id, AUserId, BUserId, CUserId, DUserId, EUserId, FUserId')
      .or(
        `AUserId.eq.${userId},BUserId.eq.${userId},CUserId.eq.${userId},DUserId.eq.${userId},EUserId.eq.${userId},FUserId.eq.${userId}`
      )
      .maybeSingle();

    if (lobbyError) {
      return res
        .status(500)
        .json({ error: 'Error fetching lobby', details: lobbyError.message });
    }
    if (!lobbyRow) {
      return res.status(404).json({ error: 'Lobby not found for this user' });
    }

    // 5) Collect leaderIds (integers) from the Lobby row and filter undefined/null
    const leadersInLobby = [
      lobbyRow.AUserId,
      lobbyRow.BUserId,
      lobbyRow.CUserId,
      lobbyRow.DUserId,
      lobbyRow.EUserId,
      lobbyRow.FUserId,
    ].filter((id) => id !== null && id !== undefined);
    // Double check that the current user is indeed a leaderId
    if (!leadersInLobby.includes(userId)) {
      return res.status(403).json({
        error: 'Only team leaders can be in a lobby and play the game',
      });
    }

    if (leadersInLobby.length === 0) {
      return res.status(400).json({ error: 'No teams/users found in lobby' });
    }

    // 6) Fetch all teams whose leaderId is among leadersInLobby
    const { data: teamsInLobby, error: teamsError } = await supabase
      .from('Team')
      .select('id, leaderId, isReadyScotland')
      .in('leaderId', leadersInLobby);

    if (teamsError) {
      return res.status(500).json({
        error: 'Error fetching teams in lobby',
        details: teamsError.message,
      });
    }

    // If some leaders do not have a corresponding Team row, handle that as needed.
    // Check if every team in this lobby has isReadyScotland === true
    const allReady =
      Array.isArray(teamsInLobby) &&
      teamsInLobby.length > 0 &&
      teamsInLobby.every((t) => !!t.isReadyScotland);

    if (!allReady) {
      // Return a clear response instead of silently returning
      return res.status(200).json({
        message: 'Not all teams are ready yet',
        team: {
          id: teamId,
          previousIsReady: teamRow.isReadyScotland,
          currentIsReady: updatedTeamRow.isReadyScotland,
        },
        lobbyId: lobbyRow.id,
      });
    }

    // 7) All teams ready: create / form the game board and initialize GameState
    // Validate lobbyId before proceeding
    const lobbyId = lobbyRow.id;
    if (!lobbyId) {
      return res.status(400).json({ error: 'Invalid lobby ID' });
    }

    // Option A: If formGameBoard is synchronous or returns an object and may modify DB,
    // await it and handle errors.
    try {
      // Assume formGameBoard returns gameBoard object or throws
      const gameBoard = await formGameBoard(lobbyId); // implement this fn
    } catch (fgbErr) {
      console.error('formGameBoard error:', fgbErr);
      return res.status(500).json({
        error: 'Failed to form game board',
        details: fgbErr.message || fgbErr,
      });
    }

    // 8) Return final success response
    return res.status(200).json({
      message: 'All teams are ready. Game board formed.',
      team: {
        id: teamId,
        previousIsReady: teamRow.isReadyScotland,
        currentIsReady: updatedTeamRow.isReadyScotland,
      },
      lobbyId,
    });
  } catch (error) {
    console.error('Error in startGame:', error);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', details: error.message });
  }
};

async function formGameBoard(lobbyId) {
  const supabase = require('../../src/config/supabase');
  console.log('Forming game board for lobby:', lobbyId);
  //position all players on the gameboard, and return the gameboard details
  //get lobby ID, and fetch the gameboard details, update movehistory and gamestate (check schema from prisma.schema file),
  //set MR.X to 1, player turn to 1 (first player in team array), p2 to 2 and so on
  //gameboard has only nodes info and all that, common to all games
  //check karle movehistory aur gamestate mein kya update aur kahan karna hai, agar schema mein changes laane honge toh (try not to tho)

  // 1. Fetch the lobby row to get all 6 user slots
  const { data: lobbyRow, error: lobbyErr } = await supabase
    .from('Lobby')
    .select('AUserId, BUserId, CUserId, DUserId, EUserId, FUserId')
    .eq('id', lobbyId)
    .single();

  if (lobbyErr || !lobbyRow) {
    console.error('Error fetching lobby users:', lobbyErr);
    return null;
  }

  // 2. Collect valid userIds from the lobby row
  const lobbyUsers = [
    lobbyRow.AUserId,
    lobbyRow.BUserId,
    lobbyRow.CUserId,
    lobbyRow.DUserId,
    lobbyRow.EUserId,
    lobbyRow.FUserId,
  ].filter((id) => id !== null && id !== undefined);

  if (lobbyUsers.length === 0) {
    console.error('No users found in this lobby');
    return null;
  }

  // 3. Fetch teams whose leaders are in this lobby
  const { data: teams, error: teamErr } = await supabase
    .from('Team')
    .select('id, leaderId')
    .in('leaderId', lobbyUsers);

  if (teamErr) {
    console.error('Error fetching teams:', teamErr);
    return null;
  }

  if (!teams || teams.length === 0) {
    console.error('No valid teams found for this lobby');
    return null;
  }

  // 4. Build the players array from team leaders
  const players = teams.map((team, idx) => ({
    userId: team.leaderId,
    teamId: team.id,
    order: idx + 1,
    isMrX: idx === 0, // First leader = MrX (can randomize if needed)
  }));

  // 5. Build the state JSON
  // Assign initial positions 1,2,3,4,5,6 to players 1,2,3,4,5,6
  // Dynamically assign positions to userIds
  const positions = {};
  players.forEach((p, idx) => {
    positions[p.userId] = {
      userId: p.userId,
      position: idx + 1,
    };
  });
  const stateJSON = {
    players,
    positions,
    // add more game state fields as needed
  };

  // 6. Insert into GameState table
  const { error: gsErr } = await supabase.from('GameState').insert([
    {
      lobbyId,
      stateJSON,
      currentTurnUserId: players[0].userId.toString(),
    },
  ]);

  if (gsErr) {
    console.error('Error creating GameState:', gsErr);
    return null;
  }

  console.log('GameState initialized:', stateJSON);
  return stateJSON;
}

exports.getMoveOptions = async (req, res) => {
  //based on the player position, return the possible move options
  //check the nodes from node data in gameboard
  //check present position of player from gamestate or movehistory
  //return the possible move options
  //take userId as input

  const { userId, lobbyId } = req.body;

  //getting stateJSON and currentTurnUserId from GameState table
  const { data: gameState, error: gsError } = await supabase
    .from('GameState')
    .select('*')
    .eq('lobbyId', lobbyId)
    .single();
  if (gsError) {
    return res.status(500).json({
      error: 'Error fetching game state',
      details: gsError.message,
    });
  }
  if (!gameState) {
    return res.status(404).json({ error: 'Game state not found' });
  }

  const stateJSON = gameState.stateJSON;
  const currentTurnUserId = gameState.currentTurnUserId;

  // Check if it's the user's turn
  if (currentTurnUserId !== userId.toString()) {
    return res.status(403).json({ error: "It's not your turn" });
  }

  // Get the player's position from the positions object
  const playerPositionObj = stateJSON.positions[userId];
  if (!playerPositionObj || !playerPositionObj.position) {
    return res
      .status(404)
      .json({ error: 'Player position not found in game state' });
  }
  const currentPosition = playerPositionObj.position;

  // Fetch possible move options from GameBoard table based on current position
  const { data: nodeData, error: nodeError } = await supabase
    .from('GameBoard')
    .select('connectionsJSON')
    .eq('nodeId', currentPosition)
    .single();
  if (nodeError) {
    return res.status(500).json({
      error: 'Error fetching node data',
      details: nodeError.message,
    });
  }
  if (!nodeData) {
    return res.status(404).json({ error: 'Node data not found' });
  }

  const moveOptions = nodeData.connectionsJSON; // connectionsJSON is an array of possible moves

  res.json({ moveOptions });

  //Logic: Check for the current current node
  //Go to the db check possible nodes for current node
  //Return Possible Nodes
};
exports.makeMove = async (req, res) => {
  // check DB for balance, make move only if possible
  const { userId, lobbyId, chosenNode } = req.body;

  if (!userId || !lobbyId || !chosenNode) {
    return res.status(400).json({
      error: 'Missing required fields: userId, lobbyId, or chosenNode',
    });
  }

  // Get game state
  const { data: gameState, error: gsError } = await supabase
    .from('GameState')
    .select('*')
    .eq('lobbyId', lobbyId)
    .single();
  if (gsError) {
    return res.status(500).json({
      error: 'Error fetching game state',
      details: gsError.message || gsError,
    });
  }
  if (!gameState) {
    return res.status(404).json({ error: 'Game state not found' });
  }

  const stateJSON = gameState.stateJSON;
  const currentTurnUserId = gameState.currentTurnUserId;

  // Check if it's the user's turn
  if (currentTurnUserId !== userId.toString()) {
    return res.status(403).json({ error: "It's not your turn" });
  }

  // Find the player in stateJSON
  const playerIndex = stateJSON.players.findIndex(
    (p) => p.userId.toString() === userId.toString()
  );
  if (playerIndex === -1) {
    return res.status(404).json({ error: 'Player not found in game state' });
  }

  // Get the player's current position from stateJSON.positions
  const playerPositionObj = stateJSON.positions[userId];
  if (!playerPositionObj || !playerPositionObj.position) {
    return res
      .status(404)
      .json({ error: 'Player position not found in game state' });
  }
  const currentPosition = playerPositionObj.position;

  // Fetch possible move options from GameBoard table based on current position
  const { data: nodeData, error: nodeError } = await supabase
    .from('GameBoard')
    .select('connectionsJSON')
    .eq('nodeId', currentPosition)
    .single();
  if (nodeError) {
    return res.status(500).json({
      error: 'Error fetching node data',
      details: nodeError.message,
    });
  }
  if (!nodeData) {
    return res.status(404).json({ error: 'Node data not found' });
  }
  let moveOptions = nodeData.connectionsJSON;
  if (Array.isArray(moveOptions)) {
    // OK
  } else if (moveOptions && Array.isArray(moveOptions.nodes)) {
    moveOptions = moveOptions.nodes;
  } else if (moveOptions && typeof moveOptions === 'object') {
    // Support connectionsJSON as an object with keys (buses, subways, taxies)
    moveOptions = Object.values(moveOptions).filter(Array.isArray).flat();
  } else if (typeof moveOptions === 'string') {
    try {
      const parsed = JSON.parse(moveOptions);
      if (Array.isArray(parsed)) {
        moveOptions = parsed;
      } else if (parsed && Array.isArray(parsed.nodes)) {
        moveOptions = parsed.nodes;
      } else if (parsed && typeof parsed === 'object') {
        moveOptions = Object.values(parsed).filter(Array.isArray).flat();
      } else {
        return res.status(500).json({
          error:
            'connectionsJSON string is valid JSON but does not contain an array, nodes array, or transport arrays',
          details: { value: moveOptions },
        });
      }
    } catch (error) {
      return res.status(500).json({
        error: 'connectionsJSON is not valid JSON',
        details: { value: moveOptions, parseError: error.message },
      });
    }
  } else if (moveOptions === null || moveOptions === undefined) {
    return res.status(500).json({
      error: 'connectionsJSON is null or undefined',
      details: { value: moveOptions },
    });
  } else {
    return res.status(500).json({
      error:
        'connectionsJSON is not an array, object with nodes array, or transport arrays',
      details: { value: moveOptions },
    });
  }

  // Output chosenNode and possible nodes before validating
  console.log('Chosen node:', chosenNode);
  console.log('Possible nodes:', moveOptions);
  // Optionally, also send in response for debugging
  res.locals.chosenNode = chosenNode;
  res.locals.possibleNodes = moveOptions;

  // Validate chosenNode is a valid move
  if (!moveOptions.includes(Number(chosenNode))) {
    return res.status(400).json({
      error: 'Invalid move: chosen node is not a valid option',
      chosenNode,
      possibleNodes: moveOptions,
      userId,
      lobbyId,
    });
  }

  // Update player position in stateJSON.positions
  stateJSON.positions[userId].position = chosenNode;

  // Determine next player's turn
  const playerIds = stateJSON.players.map((p) => p.userId);
  const currentPlayerIdx = playerIds.indexOf(Number(userId));
  if (currentPlayerIdx === -1) {
    return res.status(500).json({
      error: 'Current player not found in player list',
      userId,
      lobbyId,
      chosenNode,
      playerIds,
      statePlayers: stateJSON.players,
    });
  }
  const nextPlayerIndex = (currentPlayerIdx + 1) % playerIds.length;
  const nextTurnUserId = playerIds[nextPlayerIndex].toString();

  // Before inserting into MoveHistory
  const { data: teamCheck } = await supabase
    .from('Team')
    .select('leaderId')
    .eq('leaderId', userId)
    .single();

  if (!teamCheck) {
    return res.status(403).json({
      error: 'Only team leaders can play and record moves',
    });
  }

  // Update GameState in DB
  const { error: updateError } = await supabase
    .from('GameState')
    .update({
      stateJSON,
      currentTurnUserId: nextTurnUserId,
    })
    .eq('lobbyId', lobbyId);
  if (updateError) {
    return res.status(500).json({
      error: 'Error updating game state',
      details: updateError.message,
    });
  }

  // Log move in MoveHistory
  const { error: mhError } = await supabase.from('MoveHistory').insert([
    {
      lobbyId,
      userId,
      moveJSON: {
        from: currentPosition,
        to: chosenNode,
      },
      roundNumber: 0, // You may want to increment this properly
      createdAt: new Date().toISOString(),
    },
  ]);
  if (mhError) {
    return res.status(500).json({
      error: 'Error logging move history',
      details: mhError.message,
    });
  }

  res.json({
    message: 'Move made successfully',
  });
};
