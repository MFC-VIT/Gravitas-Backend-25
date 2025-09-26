const supabase = require('../config/supabase');

function randomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function generateTeamCode() {
  let code;
  let exists = true;
  while (exists) {
    code = randomCode();
    const { data: existing, error } = await supabase
      .from('Team')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (error) throw error;
    if (!existing) exists = false;
  }
  return code;
}

exports.createTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name required' });

    const code = await generateTeamCode();

    const { data: team, error: teamError } = await supabase
      .from('Team')
      .insert([{ name, code, leaderId: userId, teamPoints: 0 }])
      .select()
      .single();
    if (teamError) return res.status(500).json({ error: teamError.message });

    const { error: memberError } = await supabase
      .from('TeamPlayer')
      .insert([{ teamId: team.id, userId }]);
    if (memberError)
      return res.status(500).json({ error: memberError.message });

    const { data: members, error: membersError } = await supabase
      .from('TeamPlayer')
      .select('userId')
      .eq('teamId', team.id);
    if (membersError)
      return res.status(500).json({ error: membersError.message });

    res
      .status(201)
      .json({ message: 'Team created', team: { ...team, players: members } });
  } catch (err) {
    console.error('createTeam error', err);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

exports.joinTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Team code required' });

    const { data: team, error: teamError } = await supabase
      .from('Team')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (teamError) return res.status(500).json({ error: teamError.message });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const { data: existing, error: existError } = await supabase
      .from('TeamPlayer')
      .select('id')
      .eq('teamId', team.id)
      .eq('userId', userId)
      .maybeSingle();
    if (existError) return res.status(500).json({ error: existError.message });
    if (existing)
      return res.status(400).json({ error: 'Already in this team' });
    //checking if user is already in another team
    const { data: otherTeam, error: otherError } = await supabase
      .from('TeamPlayer')
      .select('id')
      .eq('userId', userId)
      .maybeSingle();
    if (otherError) return res.status(500).json({ error: otherError.message });
    if (otherTeam)
      return res.status(400).json({ error: 'Already in another team' });

    const { error: addError } = await supabase
      .from('TeamPlayer')
      .insert([{ teamId: team.id, userId }]);
    if (addError) return res.status(500).json({ error: addError.message });

    const { data: members, error: membersError } = await supabase
      .from('TeamPlayer')
      .select('userId')
      .eq('teamId', team.id);
    if (membersError)
      return res.status(500).json({ error: membersError.message });

    res.json({ message: 'Joined team', team: { ...team, players: members } });
  } catch (err) {
    console.error('joinTeam error', err);
    res.status(500).json({ error: 'Failed to join team' });
  }
};

exports.leaveTeam = async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId } = req.body;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    const { data: membership, error: membershipError } = await supabase
      .from('TeamPlayer')
      .select('id, teamId, userId, team:Team!inner(id, leaderId)')
      .eq('teamId', teamId)
      .eq('userId', userId)
      .maybeSingle();
    if (membershipError)
      return res.status(500).json({ error: membershipError.message });
    if (!membership) return res.status(404).json({ error: 'Not a member' });

    const { error: delError } = await supabase
      .from('TeamPlayer')
      .delete()
      .eq('id', membership.id);
    if (delError) return res.status(500).json({ error: delError.message });

    const { data: remaining, error: remainingError } = await supabase
      .from('TeamPlayer')
      .select('userId')
      .eq('teamId', teamId);
    if (remainingError)
      return res.status(500).json({ error: remainingError.message });

    if (!remaining || remaining.length === 0) {
      const { error: teamDeleteError } = await supabase
        .from('Team')
        .delete()
        .eq('id', teamId);
      if (teamDeleteError)
        return res.status(500).json({ error: teamDeleteError.message });
      return res.json({ message: 'Left team; team deleted (no members left)' });
    }

    if (membership.team.leaderId === userId) {
      const newLeaderId = remaining[0].userId;
      const { error: leaderUpdateError } = await supabase
        .from('Team')
        .update({ leaderId: newLeaderId })
        .eq('id', teamId);
      if (leaderUpdateError)
        return res.status(500).json({ error: leaderUpdateError.message });
      return res.json({
        message: 'Left team; leadership transferred',
        newLeaderId,
      });
    }

    res.json({ message: 'Left team' });
  } catch (err) {
    console.error('leaveTeam error', err);
    res.status(500).json({ error: 'Failed to leave team' });
  }
};

exports.listMembers = async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    const { data: team, error: teamError } = await supabase
      .from('Team')
      .select('*')
      .eq('id', teamId)
      .maybeSingle();
    if (teamError) return res.status(500).json({ error: teamError.message });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const { data: members, error: membersError } = await supabase
      .from('TeamPlayer')
      .select('userId')
      .eq('teamId', teamId);
    if (membersError)
      return res.status(500).json({ error: membersError.message });

    res.json({
      message: 'Team members fetched',
      team: { ...team, players: members },
    });
  } catch (err) {
    console.error('listMembers error', err);
    res.status(500).json({ error: 'Failed to list members' });
  }
};

exports.transferLeadership = async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId, newLeaderId } = req.body;
    if (!teamId || !newLeaderId)
      return res.status(400).json({ error: 'teamId & newLeaderId required' });

    const { data: team, error: teamError } = await supabase
      .from('Team')
      .select('*')
      .eq('id', teamId)
      .maybeSingle();
    if (teamError) return res.status(500).json({ error: teamError.message });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.leaderId !== userId)
      return res
        .status(403)
        .json({ error: 'Only leader can transfer leadership' });

    const { data: membership, error: membershipError } = await supabase
      .from('TeamPlayer')
      .select('id')
      .eq('teamId', teamId)
      .eq('userId', newLeaderId)
      .maybeSingle();
    if (membershipError)
      return res.status(500).json({ error: membershipError.message });
    if (!membership)
      return res
        .status(400)
        .json({ error: 'New leader must be a team member' });

    const { error: updateError } = await supabase
      .from('Team')
      .update({ leaderId: newLeaderId })
      .eq('id', teamId);
    if (updateError)
      return res.status(500).json({ error: updateError.message });

    res.json({ message: 'Leadership transferred', newLeaderId });
  } catch (err) {
    console.error('transferLeadership error', err);
    res.status(500).json({ error: 'Failed to transfer leadership' });
  }
};

exports.kickMember = async (req, res) => {
  try {
    const userId = req.user.id; // leader
    const { teamId, memberId } = req.body;
    if (!teamId || !memberId)
      return res.status(400).json({ error: 'teamId & memberId required' });
    if (userId === memberId)
      return res.status(400).json({ error: 'Use leaveTeam to leave yourself' });

    const { data: team, error: teamError } = await supabase
      .from('Team')
      .select('*')
      .eq('id', teamId)
      .maybeSingle();
    if (teamError) return res.status(500).json({ error: teamError.message });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.leaderId !== userId)
      return res.status(403).json({ error: 'Only leader can kick members' });

    const { data: membership, error: membershipError } = await supabase
      .from('TeamPlayer')
      .select('id')
      .eq('teamId', teamId)
      .eq('userId', memberId)
      .maybeSingle();
    if (membershipError)
      return res.status(500).json({ error: membershipError.message });
    if (!membership) return res.status(404).json({ error: 'User not in team' });

    const { error: deleteError } = await supabase
      .from('TeamPlayer')
      .delete()
      .eq('id', membership.id);
    if (deleteError)
      return res.status(500).json({ error: deleteError.message });
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('kickMember error', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
