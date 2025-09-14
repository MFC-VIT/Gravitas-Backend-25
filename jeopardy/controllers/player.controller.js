const supabase = require('../../src/config/supabase');

exports.chooseQuestion = async (req, res) => {
  try {
    const { userId, teamId, categoryId, difficulty, lobbyId } = req.body;

    const { data: lobby, error: lobbyError } = await supabase
      .from('JeopardyLobby')
      .select('isStarted')
      .eq('id', lobbyId)
      .single();

    if (lobbyError || !lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    if (!lobby.isStarted) {
      return res.status(403).json({ error: 'Game has not started yet' });
    }

    const { data: player, error: playerError } = await supabase
      .from('User')
      .select('id, isLeader')
      .eq('id', userId)
      .eq('user_uuid', teamId)
      .single();

    if (playerError || !player) {
      return res.status(404).json({ error: 'Player not found in this team' });
    }

    if (!player.isLeader) {
      return res
        .status(403)
        .json({ error: 'Only the team leader can choose questions' });
    }

    const { data: existingAttempt, error: existingError } = await supabase
      .from('AnswerAttempt')
      .select('id')
      .eq('teamId', teamId)
      .eq('lobbyId', lobbyId)
      .eq('categoryId', categoryId)
      .eq('difficulty', difficulty)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingAttempt) {
      return res.status(400).json({
        error:
          'This team has already chosen a question for this category and difficulty',
      });
    }

    const { data: availableQuestions, error: questionError } = await supabase
      .from('Question')
      .select(
        'id, questionText, options, correctOption, categoryId, difficulty, points'
      )
      .eq('categoryId', categoryId)
      .eq('difficulty', difficulty);

    if (questionError) {
      return res.status(500).json({ error: questionError.message });
    }

    if (!availableQuestions || availableQuestions.length === 0) {
      return res.status(404).json({
        error: 'No questions available for this category and difficulty',
      });
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const chosenQuestion = availableQuestions[randomIndex];

    const { error: insertError } = await supabase.from('AnswerAttempt').insert([
      {
        teamId,
        lobbyId,
        questionId: chosenQuestion.id,
        categoryId,
        difficulty,
        selectedOption: null,
        isCorrect: null,
        answeredAt: null,
      },
    ]);

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    const { correctOption, ...questionWithoutAnswer } = chosenQuestion;

    return res.status(201).json({
      message: 'Question chosen successfully',
      question: questionWithoutAnswer,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { userId, teamId, questionId, selectedOption, lobbyId } = req.body;

    const { data: player, error: playerError } = await supabase
      .from('User')
      .select('id')
      .eq('id', userId)
      .single();

    if (playerError || !player) {
      return res.status(403).json({ error: 'Player not found in this team' });
    }

    const { data: existingAttempt, error: attemptCheckError } = await supabase
      .from('AnswerAttempt')
      .select('*')
      .eq('teamId', teamId)
      .eq('questionId', questionId)
      .maybeSingle();

    if (attemptCheckError) throw attemptCheckError;

    if (!existingAttempt) {
      return res.status(400).json({ error: 'No question chosen to answer' });
    }

    if (existingAttempt.selectedOption !== null) {
      return res.status(400).json({
        error: 'This question has already been answered by your team',
      });
    }

    const { data: question, error: questionError } = await supabase
      .from('Question')
      .select('id, correctOption, points, difficulty, categoryId')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isCorrect = selectedOption === question.correctOption;

    const { error: updateError } = await supabase
      .from('AnswerAttempt')
      .update({
        selectedOption,
        isCorrect,
        answeredAt: new Date().toISOString(),
      })
      .eq('id', existingAttempt.id);

    if (updateError) throw updateError;

    if (isCorrect) {
      const { data: team, error: teamError } = await supabase
        .from('Team')
        .select('id, teamPoints')
        .eq('id', teamId)
        .single();

      if (teamError || !team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const newPoints = (team.teamPoints || 0) + (question.points || 0);

      const { error: teamUpdateError } = await supabase
        .from('Team')
        .update({ teamPoints: newPoints })
        .eq('id', teamId);

      if (teamUpdateError) throw teamUpdateError;
    }

    return res.json({
      message: 'Answer submitted successfully',
      correct: isCorrect,
      pointsAwarded: isCorrect ? question.points : 0,
    });
  } catch (error) {
    console.error('submitAnswer error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

exports.getScoreboard = async (req, res) => {
  try {
    const { data: teams, error } = await supabase
      .from('Team')
      .select('id, name, teamPoints, code')
      .order('teamPoints', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Scoreboard fetched successfully', teams });
  } catch (err) {
    console.error('getScoreboard error', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
