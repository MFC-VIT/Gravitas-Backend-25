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

// exports.startGame = async (req, res) => {
//   // Extract the userId from route parameters
//   const { userId } = req.params;

//   try {
//     // Step 1: Find the team(s) that this user belongs to
//     const { data: teamPlayers, error: teamPlayerError } = await supabase
//       .from('TeamPlayer')
//       .select('teamId')
//       .eq('userId', userId);

//     // If no team found, return 404
//     if (teamPlayerError || !teamPlayers || teamPlayers.length === 0) {
//       return res.status(404).json({
//         error: 'Team not found for user',
//         details: teamPlayerError ? teamPlayerError.details : undefined,
//       });
//     }

//     // Step 2: Extract the teamId (note: column is 'teamId' in Supabase, not 'team_id')
//     const teamId = teamPlayers[0].teamId;

//     // Check if the user is the team leader
//     const { data: teamData, error: teamDataError } = await supabase
//       .from('Team')
//       .select('leaderId')
//       .eq('id', teamId)
//       .single();

//     if (teamDataError) {
//       return res.status(500).json({
//         error: 'Error fetching team leader information',
//         details: teamDataError.message,
//       });
//     }

//     const isLeader = teamData.leaderId === parseInt(userId);

//     if (!isLeader) {
//       // Return 403 Forbidden if the user is not the leader
//       return res.status(403).json({
//         error: 'You are not the team leader and cannot start the game',
//       });
//     }

//     // Step 3: Check if the team is ready (isReadyScotland column)
//     const { data: ready, error: StateError } = await supabase
//       .from('Team')
//       .select('isReadyScotland')
//       .eq('id', teamId)
//       .maybeSingle();

//     if (StateError) {
//       return res.status(500).json({
//         error: 'Error in finding team ready state',
//         details: StateError,
//       });
//     }

//     if (!ready) {
//       return res.status(404).json({ error: 'Team not found' });
//     }

//     if (ready.isReadyScotland == false) {
//       const { data: ready, error: readyError } = await supabase
//         .from('Team')
//         .update({ isReadyScotland: true })
//         .eq('id', teamId);

//       if (readyError) {
//         return res.status(400).json({
//           error: 'Error updating ready status',
//           details: readyError.message,
//         });
//       }
//     }

//     const { data: Lobby, error: lobbyError } = await supabase
//       .from('Lobby')
//       .select('id')
//       .or(
//         `AUserId.eq.${userId},BUserId.eq.${userId},CUserId.eq.${userId},DUserId.eq.${userId},EUserId.eq.${userId},FUserId.eq.${userId}`
//       )
//       .maybeSingle();

//     const lobbyId = Lobby ? Lobby.id : null;

//     if (lobbyError) {
//       return res.status(400).json({
//         error: 'Error fetching LobbyID',
//         details: lobbyError.message,
//       });
//     }

//     console.log('TeamState: ', ready);

//     //check for other teams being ready or not, from lobbyId, get all teams in that lobby, check if all are ready or not
//     // (AuserId, BUserId, CUserId, DUserId, EUserId, FUserId) from teams table leaderId
//     const { data: teamsInLobby, error: teamsError } = await supabase
//       .from('Team')
//       .select('id, isReadyScotland, leaderId')
//       .in(
//         'leaderId',
//         [
//           Lobby ? Lobby.AUserId : null,
//           Lobby ? Lobby.BUserId : null,
//           Lobby ? Lobby.CUserId : null,
//           Lobby ? Lobby.DUserId : null,
//           Lobby ? Lobby.EUserId : null,
//           Lobby ? Lobby.FUserId : null,
//         ].filter((id) => id !== null)
//       );

//     if (teamsError) {
//       return res.status(500).json({
//         error: 'Error fetching teams in lobby',
//         details: teamsError.message,
//       });
//     }

//     const allReady =
//       teamsInLobby && teamsInLobby.every((team) => team.isReadyScotland);

//     if (!allReady) {
//       const allReadyStat = 'Not all teams are ready yet.';
//       return; // Exit if not all teams are ready
//     }

//     const allReadyStat = 'All teams are ready. Forming game board...';
//     // Step 5: Form the game board since all teams are ready
//     // Note: Ensure lobbyId is valid before proceeding
//     if (!lobbyId) {
//       return res.status(400).json({ error: 'Invalid lobby ID' });
//     }

//     // Step 4: Return the ready state and optionally proceed to form the game board
//     //update as well
//     res.json({
//       message: 'Team ready state fetched successfully',
//       team: {
//         id: teamId,
//         'isReadyScotland old state': ready.isReadyScotland,
//         'Other Teams status': allReadyStat,
//       },
//     });
//     //get lobbyId from Lobby table, check if user id equals AUserId, BUserId or CUserId or DUserId or FUserId
//     //if yes, get lobbyId and pass it to formGameBoard function
//     //lobbyId is string in Lobby table
//     //userId is the user id in the code, and isLeader is if the user is the team leader or not. This has to be checked.

//     formGameBoard(lobbyId);
//     //if all teams are ready, then only form the game board
//     //to be implemented next
//     //work for next time I sit to code
//     //uncomment top comment of this comment block, after formgameboard thingy is tested
//   } catch (error) {
//     console.error('Error fetching ready State of team:', error);
//     res.status(500).json({
//       error: 'Internal Server Error',
//       details: error.message,
//     });
//   }
// };

// Assumes `supabase` is correctly initialized in scope
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
    // await it and handle errors. Replace with your implementation.
    try {
      // Assume formGameBoard returns gameBoard object or throws
      const gameBoard = await formGameBoard(lobbyId); // implement this fn
      // Optional: persist GameBoard and initial GameState into DB here (transaction recommended)
      // Example (pseudo):
      // await supabase.from('GameBoard').insert({ nodeId: ..., connectionsJSON: ..., transportTypes: ... })
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
    positions: {}, // to be filled with actual positions
    // add more game state fields as needed
  };
  console.log('playerOrder:', playerOrder);
  // 6. Insert into GameState
  const { error: gsErr } = await supabase.from('GameState').insert([
    {
      lobbyId,
      stateJSON,
      currentTurnUserId: playerOrder[0].userId.toString(),
    },
  ]);
  if (gsErr) throw gsErr;
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
  // Find the player in stateJSON
  const player = stateJSON.players.find(
    (p) => p.userId.toString() === userId.toString()
  );
  if (!player) {
    return res.status(404).json({ error: 'Player not found in game state' });
  }

  const currentPosition = player.position;
  if (!currentPosition) {
    return res.status(400).json({ error: 'Player position not set' });
  }

  // Fetch possible move options from NodeData table based on current position
  const { data: nodeData, error: nodeError } = await supabase
    .from('NodeData')
    .select('connectedNodes')
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

  const moveOptions = nodeData.connectedNodes; // Assuming connectedNodes is an array of possible moves

  res.json({ moveOptions });

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

  const { userId, lobbyId, chosenNode } = req.body;

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
  // Find the player in stateJSON
  const playerIndex = stateJSON.players.findIndex(
    (p) => p.userId.toString() === userId.toString()
  );
  if (playerIndex === -1) {
    return res.status(404).json({ error: 'Player not found in game state' });
  }

  // Update player position
  stateJSON.players[playerIndex].position = chosenNode;

  // Determine next player's turn
  const nextPlayerIndex = (playerIndex + 1) % stateJSON.players.length;
  const nextTurnUserId = stateJSON.players[nextPlayerIndex].userId.toString();

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

  res.json({
    message: 'Move made successfully',
  });
};
