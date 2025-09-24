const supabase = require('../../src/config/supabase');

async function isAdmin(userId) {
  const { data: user, error } = await supabase
    .from('User')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !user || user.role !== 'admin') {
    return false;
  }
  return true;
}

exports.getAllInitialSubmissions = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!(await isAdmin(userId))) {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { data, error } = await supabase
      .from('Idea')
      .select(
        `
        id,
        teamId,
        submittedBy,
        submittedAt,
        title,
        description,
        pptLink,
        Team(name),
        User(username)
      `
      )
      .eq('type', 'initial');

    if (error) throw error;

    return res.status(200).json({ initialSubmissions: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getAllFinalSubmissions = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!(await isAdmin(userId))) {
      return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    const { data, error } = await supabase
      .from('Idea')
      .select(
        `
        id,
        teamId,
        submittedBy,
        submittedAt,
        githubLink,
        finalPptLink,
        figmaLink,
        Team(name),
        User(username)
      `
      )
      .eq('type', 'final');

    if (error) throw error;

    return res.status(200).json({ finalSubmissions: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
