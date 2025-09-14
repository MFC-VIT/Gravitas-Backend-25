const supabase = require('../../src/config/supabase');

exports.startGame = async (req, res) => {
  try {
    const { data: lobby, error } = await supabase
      .from('jeopardylobby')
      .insert([{ isstarted: true }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      message: 'Game started successfully',
      lobbyId: lobby.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
