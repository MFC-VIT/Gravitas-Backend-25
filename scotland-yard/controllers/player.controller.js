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
exports.joinLobby = async (_req, _res) => {
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
      .select('*')
      .or(
        `AUserId.eq.${userId},BUserId.eq.${userId},CUserId.eq.${userId},DUserId.eq.${userId},EUserId.eq.${userId},FUserId.eq.${userId}`
      )
      .maybeSingle();
    if (lobbyError) {
      return res.status(500).json({
        error: 'Error fetching lobby',
        details: lobbyError.message,
      });
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
    // Option A: If formGameBoard is synchronous or returns an object and may modify DB,
    // await it and handle errors.
    try {
      // Assume formGameBoard returns gameBoard object or throws
      // 7) All teams ready: create / form the game board and initialize GameState
      const lobbyId = lobbyRow.id;
      if (!lobbyId) {
        return res.status(400).json({ error: 'Invalid lobby ID' });
      }
      await formGameBoard(lobbyId); // implement this fn
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
      lobbyId: lobbyRow.id,
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
    balance: idx === 0 ? 850 : 1320, // starting balances
    gameEnded: false,
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
    mrXMoveCount: 0,
    closed: false,
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

// --- Helpers for movement and scoring ---

function normalizeConnectionsJSON(value) {
  // returns an object { buses: number[], subways: number[], taxies: number[] }
  const empty = { buses: [], subways: [], taxies: [] };
  if (!value) return empty;
  try {
    const v = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(v)) {
      // Treat as generic edges via taxi (cheapest default)
      return {
        buses: [],
        subways: [],
        taxies: v.filter((n) => typeof n === 'number'),
      };
    }
    if (v && typeof v === 'object') {
      return {
        buses: Array.isArray(v.buses) ? v.buses : [],
        subways: Array.isArray(v.subways) ? v.subways : [],
        taxies: Array.isArray(v.taxies) ? v.taxies : [],
      };
    }
  } catch (e) {
    // ignore invalid JSON; fall through to return empty below
    void e;
  }
  return empty;
}

async function getAdjacencyMap() {
  // Build adjacency from GameBoard
  const { data, error } = await supabase
    .from('GameBoard')
    .select('nodeId, connectionsJSON');
  if (error) throw new Error('Failed to load GameBoard: ' + error.message);
  const adj = new Map();
  for (const row of data || []) {
    const norm = normalizeConnectionsJSON(row.connectionsJSON);
    const neighbors = new Set([...norm.buses, ...norm.subways, ...norm.taxies]);
    adj.set(row.nodeId, Array.from(neighbors));
  }
  return adj;
}

function bfsDistance(adj, start, target) {
  if (start === target) return 0;
  const q = [start];
  const seen = new Set([start]);
  let dist = 0;
  while (q.length) {
    const size = q.length;
    dist++;
    for (let i = 0; i < size; i++) {
      const cur = q.shift();
      const neighbors = adj.get(cur) || [];
      for (const nb of neighbors) {
        if (seen.has(nb)) continue;
        if (nb === target) return dist;
        seen.add(nb);
        q.push(nb);
      }
    }
  }
  return Infinity;
}

function isNodeOccupiedByDetective(stateJSON, targetNode, exceptUserId) {
  const { players, positions } = stateJSON;
  for (const p of players) {
    if (p.isMrX) continue;
    if (exceptUserId && p.userId === Number(exceptUserId)) continue;
    const pos = positions[p.userId]?.position;
    if (pos === targetNode) return true;
  }
  return false;
}

async function awardDetectiveCatchPoints(lobbyId, stateJSON) {
  const { players, positions } = stateJSON;
  const mrX = players.find((p) => p.isMrX);
  if (!mrX) return;
  const mrxPos = positions[mrX.userId]?.position;
  if (!mrxPos) return;
  const adj = await getAdjacencyMap();
  const detectives = players.filter((p) => !p.isMrX);
  const scored = detectives.map((d) => ({
    userId: d.userId,
    teamId: d.teamId,
    dist: bfsDistance(adj, positions[d.userId]?.position, mrxPos),
  }));
  scored.sort((a, b) => a.dist - b.dist);
  // Points: 5000, 4000, 3000, ... min 0
  stateJSON.scores = stateJSON.scores || {};
  for (let i = 0; i < scored.length; i++) {
    const pts = Math.max(0, 5000 - i * 1000);
    if (pts <= 0) break;
    // Fetch current points then update with addition
    const { data: teamRow } = await supabase
      .from('Team')
      .select('teamPoints')
      .eq('id', scored[i].teamId)
      .single();
    const curr = (teamRow?.teamPoints ?? 0) + pts;
    try {
      await supabase
        .from('Team')
        .update({ teamPoints: curr })
        .eq('id', scored[i].teamId);
    } catch (e) {
      console.debug(
        'awardDetectiveCatchPoints: teamPoints update failed',
        e?.message || e
      );
    }
    // Also keep in state
    stateJSON.scores[scored[i].teamId] =
      (stateJSON.scores[scored[i].teamId] || 0) + pts;
  }
  // Close lobby
  // Close lobby (best-effort)
  try {
    await supabase.from('Lobby').update({ isStarted: false }).eq('id', lobbyId);
  } catch (e) {
    console.debug(
      'awardDetectiveCatchPoints: failed to close lobby',
      e?.message || e
    );
  }
  stateJSON.closed = true;
}

async function awardMrXVictoryPoints(lobbyId, stateJSON) {
  const { players, mrXMoveCount } = stateJSON;
  const mrX = players.find((p) => p.isMrX);
  if (!mrX) return;
  const pts = Math.floor((5000 / 20) * (mrXMoveCount || 0));
  const { data: teamRow } = await supabase
    .from('Team')
    .select('teamPoints')
    .eq('id', mrX.teamId)
    .single();
  const curr = (teamRow?.teamPoints ?? 0) + pts;
  try {
    await supabase
      .from('Team')
      .update({ teamPoints: curr })
      .eq('id', mrX.teamId);
  } catch (e) {
    console.debug(
      'awardMrXVictoryPoints: teamPoints update failed',
      e?.message || e
    );
  }
  stateJSON.scores = stateJSON.scores || {};
  stateJSON.scores[mrX.teamId] = (stateJSON.scores[mrX.teamId] || 0) + pts;
  // Close lobby
  // Close lobby (best-effort)
  try {
    await supabase.from('Lobby').update({ isStarted: false }).eq('id', lobbyId);
  } catch (e) {
    console.debug(
      'awardMrXVictoryPoints: failed to close lobby',
      e?.message || e
    );
  }
  stateJSON.closed = true;
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

  const normConn = normalizeConnectionsJSON(nodeData.connectionsJSON);
  const moveOptions = {
    taxi: normConn.taxies,
    bus: normConn.buses,
    subway: normConn.subways,
    all: [
      ...new Set([...normConn.taxies, ...normConn.buses, ...normConn.subways]),
    ],
  };

  res.json({ moveOptions });

  //Logic: Check for the current current node
  //Go to the db check possible nodes for current node
  //Return Possible Nodes
};
exports.makeMove = async (req, res) => {
  // check DB for balance, make move only if possible
  const { userId, lobbyId, chosenNode, transport } = req.body;

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
  const normConn = normalizeConnectionsJSON(nodeData.connectionsJSON);
  const moveOptions = [
    ...new Set([...normConn.buses, ...normConn.subways, ...normConn.taxies]),
  ];

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

  // Occupancy rule: detectives cannot move onto another detective
  const movingPlayer = stateJSON.players[playerIndex];
  const isDetective = !movingPlayer.isMrX;
  const targetOccupiedByDetective = isNodeOccupiedByDetective(
    stateJSON,
    Number(chosenNode),
    userId
  );
  const mrXPlayer = stateJSON.players.find((p) => p.isMrX);
  const mrXPos = stateJSON.positions[mrXPlayer.userId]?.position;
  if (
    isDetective &&
    targetOccupiedByDetective &&
    Number(chosenNode) !== mrXPos
  ) {
    return res.status(400).json({
      error: 'Invalid move: target node occupied by another detective',
      chosenNode,
    });
  }

  // Determine transport/cost
  const COSTS = { taxi: 44, bus: 55, subway: 110 };
  const connectsBy = {
    taxi: normConn.taxies.includes(Number(chosenNode)),
    bus: normConn.buses.includes(Number(chosenNode)),
    subway: normConn.subways.includes(Number(chosenNode)),
  };
  let mode = transport;
  if (!mode) {
    // choose cheapest available
    if (connectsBy.taxi) mode = 'taxi';
    else if (connectsBy.bus) mode = 'bus';
    else if (connectsBy.subway) mode = 'subway';
  }
  if (!mode || !COSTS[mode]) {
    return res
      .status(400)
      .json({ error: 'Transport mode required/invalid for this move' });
  }
  if (!connectsBy[mode]) {
    return res
      .status(400)
      .json({ error: `Selected transport ${mode} is not valid for this edge` });
  }

  // Balance checks
  const balance = movingPlayer.balance ?? 0;
  if (balance < 44) {
    movingPlayer.gameEnded = true;
    // If all detectives gameEnded, Mr X wins
    const allDetectivesDone = stateJSON.players
      .filter((p) => !p.isMrX)
      .every((p) => p.gameEnded);
    if (allDetectivesDone) {
      await awardMrXVictoryPoints(lobbyId, stateJSON);
      // Persist state closure
      await supabase
        .from('GameState')
        .update({ stateJSON, currentTurnUserId: gameState.currentTurnUserId })
        .eq('lobbyId', lobbyId);
      return res
        .status(200)
        .json({ message: 'Mr X wins! All detectives are out of balance.' });
    }
    // Persist state and inform
    await supabase
      .from('GameState')
      .update({ stateJSON, currentTurnUserId: gameState.currentTurnUserId })
      .eq('lobbyId', lobbyId);
    return res
      .status(400)
      .json({ error: 'Insufficient balance (<44). Wait for game to end.' });
  }
  const moveCost = COSTS[mode];
  if (balance < moveCost) {
    return res
      .status(400)
      .json({ error: `Insufficient balance for ${mode} move` });
  }

  // Apply costs
  movingPlayer.balance = balance - moveCost;
  if (isDetective) {
    // Transfer to Mr X
    mrXPlayer.balance = (mrXPlayer.balance ?? 0) + moveCost;
    // If detective's balance falls below 44 after this move, mark gameEnded
    if (movingPlayer.balance < 44) {
      movingPlayer.gameEnded = true;
    }
  } else {
    // Mr X moved; count escape move
    stateJSON.mrXMoveCount = (stateJSON.mrXMoveCount || 0) + 1;
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
  // Determine next player's turn, skipping ended players
  let nextPlayerIndex = (currentPlayerIdx + 1) % playerIds.length;
  for (let i = 0; i < playerIds.length; i++) {
    const candidate = stateJSON.players.find(
      (p) => p.userId === playerIds[nextPlayerIndex]
    );
    if (candidate && !candidate.gameEnded) break;
    nextPlayerIndex = (nextPlayerIndex + 1) % playerIds.length;
  }
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

  // Check catch condition: detective moved onto Mr X
  if (isDetective && Number(chosenNode) === mrXPos) {
    await awardDetectiveCatchPoints(lobbyId, stateJSON);
    await supabase
      .from('GameState')
      .update({ stateJSON, currentTurnUserId: nextTurnUserId })
      .eq('lobbyId', lobbyId);
    return res.status(200).json({ message: 'Imposter caught! Lobby closed.' });
  }
  // Check catch condition: Mr X moved onto a detective
  if (
    !isDetective &&
    isNodeOccupiedByDetective(stateJSON, Number(chosenNode))
  ) {
    await awardDetectiveCatchPoints(lobbyId, stateJSON);
    await supabase
      .from('GameState')
      .update({ stateJSON, currentTurnUserId: nextTurnUserId })
      .eq('lobbyId', lobbyId);
    return res
      .status(200)
      .json({ message: 'Imposter encountered detective! Lobby closed.' });
  }

  // Check Mr X victory condition (all detectives ended)
  const allDetectivesDone = stateJSON.players
    .filter((p) => !p.isMrX)
    .every((p) => p.gameEnded);
  if (allDetectivesDone && !stateJSON.closed) {
    await awardMrXVictoryPoints(lobbyId, stateJSON);
    await supabase
      .from('GameState')
      .update({ stateJSON, currentTurnUserId: nextTurnUserId })
      .eq('lobbyId', lobbyId);
    return res.status(200).json({ message: 'Mr X wins! Lobby closed.' });
  }

  res.json({ message: 'Move made successfully' });
};

// Mr X double move route handler
exports.mrxDoubleMove = async (req, res) => {
  const {
    userId,
    lobbyId,
    firstNode,
    secondNode,
    firstTransport,
    secondTransport,
  } = req.body;
  if (!userId || !lobbyId || !firstNode || !secondNode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Load state
  const { data: gameState, error: gsError } = await supabase
    .from('GameState')
    .select('*')
    .eq('lobbyId', lobbyId)
    .single();
  if (gsError || !gameState)
    return res.status(500).json({ error: 'Failed to load game state' });
  const stateJSON = gameState.stateJSON;
  const mrX = stateJSON.players.find((p) => p.isMrX);
  if (!mrX || mrX.userId.toString() !== userId.toString()) {
    return res.status(403).json({ error: 'Only Mr X can double move' });
  }
  if (gameState.currentTurnUserId !== userId.toString()) {
    return res.status(403).json({ error: "It's not your turn" });
  }
  // Helper to validate a single hop and cost
  const COSTS = { taxi: 44, bus: 55, subway: 110 };
  const validateHop = async (fromNode, toNode, transport) => {
    const { data: nodeRow, error: nodeErr } = await supabase
      .from('GameBoard')
      .select('connectionsJSON')
      .eq('nodeId', fromNode)
      .single();
    if (nodeErr || !nodeRow) throw new Error('Invalid from node');
    const conn = normalizeConnectionsJSON(nodeRow.connectionsJSON);
    const connectsBy = {
      taxi: conn.taxies.includes(Number(toNode)),
      bus: conn.buses.includes(Number(toNode)),
      subway: conn.subways.includes(Number(toNode)),
    };
    let mode = transport;
    if (!mode) {
      if (connectsBy.taxi) mode = 'taxi';
      else if (connectsBy.bus) mode = 'bus';
      else if (connectsBy.subway) mode = 'subway';
    }
    if (!mode || !COSTS[mode] || !connectsBy[mode])
      throw new Error('Invalid transport for hop');
    return { mode, cost: COSTS[mode] };
  };

  try {
    const from0 = stateJSON.positions[userId]?.position;
    const hop1 = await validateHop(from0, firstNode, firstTransport);
    const hop2 = await validateHop(
      Number(firstNode),
      secondNode,
      secondTransport
    );
    const totalCost = hop1.cost + hop2.cost;
    if ((mrX.balance ?? 0) < 44) {
      mrX.gameEnded = true;
      await supabase
        .from('GameState')
        .update({ stateJSON })
        .eq('lobbyId', lobbyId);
      return res.status(400).json({ error: 'Insufficient balance (<44).' });
    }
    if ((mrX.balance ?? 0) < totalCost) {
      return res
        .status(400)
        .json({ error: 'Insufficient balance for double move' });
    }
    // Apply cost
    mrX.balance -= totalCost;
    // Move positions
    stateJSON.positions[userId].position = Number(secondNode);
    // Count escapes
    stateJSON.mrXMoveCount = (stateJSON.mrXMoveCount || 0) + 2;

    // Next turn
    const playerIds = stateJSON.players.map((p) => p.userId);
    const currentPlayerIdx = playerIds.indexOf(Number(userId));
    let nextPlayerIndex = (currentPlayerIdx + 1) % playerIds.length;
    for (let i = 0; i < playerIds.length; i++) {
      const candidate = stateJSON.players.find(
        (p) => p.userId === playerIds[nextPlayerIndex]
      );
      if (candidate && !candidate.gameEnded) break;
      nextPlayerIndex = (nextPlayerIndex + 1) % playerIds.length;
    }
    const nextTurnUserId = playerIds[nextPlayerIndex].toString();

    // Persist
    await supabase
      .from('GameState')
      .update({ stateJSON, currentTurnUserId: nextTurnUserId })
      .eq('lobbyId', lobbyId);

    // If ended on detective node -> caught
    if (isNodeOccupiedByDetective(stateJSON, Number(secondNode))) {
      await awardDetectiveCatchPoints(lobbyId, stateJSON);
      await supabase
        .from('GameState')
        .update({ stateJSON, currentTurnUserId: nextTurnUserId })
        .eq('lobbyId', lobbyId);
      return res
        .status(200)
        .json({ message: 'Imposter caught after double move! Lobby closed.' });
    }

    return res.status(200).json({ message: 'Double move successful' });
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Double move failed' });
  }
};
