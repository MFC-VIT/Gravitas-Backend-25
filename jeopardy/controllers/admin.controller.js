const supabase = require('../../src/config/supabase');

exports.startGame = async (req, res) => {
  try {
    const userId = req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: user, error: userError } = await supabase
      .from('User')
      .select('role')
      .eq('id', userId)
      .single();
    console.log(userId);
    if (userError) {
      return res.status(500).json({ error: userError.message });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Permission denied. Only admins can start a game.' });
    }

    const { data: lobby, error: lobbyError } = await supabase
      .from('JeopardyLobby')
      .insert([{ isStarted: true }])
      .select()
      .single();

    if (lobbyError) {
      return res.status(500).json({ error: lobbyError.message });
    }

    return res.status(201).json({
      message: 'Game started successfully by admin',
      lobbyId: lobby.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
