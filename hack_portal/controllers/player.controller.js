const supabase = require('../../src/config/supabase');

exports.ideaSubmission = async (req, res) => {
  try {
    const { teamId, userId, title, description, pptLink } = req.body;

    const { data: teamPlayer, error: tpError } = await supabase
      .from('TeamPlayer')
      .select('isLeader')
      .eq('teamId', teamId)
      .eq('userId', userId)
      .maybeSingle();

    if (tpError) throw tpError;
    if (!teamPlayer?.isLeader) {
      return res
        .status(403)
        .json({ error: 'Only team leaders can submit ideas' });
    }

    const { data: existing, error: existError } = await supabase
      .from('Idea')
      .select('id')
      .eq('teamId', teamId)
      .eq('type', 'initial')
      .maybeSingle();

    if (existError) throw existError;
    if (existing) {
      return res
        .status(400)
        .json({ error: 'Initial idea already submitted for this team' });
    }

    const { data, error } = await supabase
      .from('Idea')
      .insert([
        {
          teamId,
          submittedBy: userId,
          type: 'initial',
          title,
          description,
          pptLink,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: 'Initial idea submitted successfully',
      idea: data,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.finalSubmission = async (req, res) => {
  try {
    const { teamId, userId, githubLink, finalPptLink, figmaLink } = req.body;

    const { data: teamPlayer, error: tpError } = await supabase
      .from('TeamPlayer')
      .select('isLeader')
      .eq('teamId', teamId)
      .eq('userId', userId)
      .maybeSingle();

    if (tpError) throw tpError;
    if (!teamPlayer?.isLeader) {
      return res
        .status(403)
        .json({ error: 'Only team leaders can submit final ideas' });
    }

    const { data: existing, error: existError } = await supabase
      .from('Idea')
      .select('id')
      .eq('teamId', teamId)
      .eq('type', 'final')
      .maybeSingle();

    if (existError) throw existError;
    if (existing) {
      return res
        .status(400)
        .json({ error: 'Final idea already submitted for this team' });
    }

    const { data, error } = await supabase
      .from('Idea')
      .insert([
        {
          teamId,
          submittedBy: userId,
          type: 'final',
          githubLink,
          finalPptLink,
          figmaLink: figmaLink || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      message: 'Final idea submitted successfully',
      finalIdea: data,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
