const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { error } = require('console');
// const { supabase } = require('../config/supabase');

// Generate Tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1500m' }
  );
};

const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // Debug: log user.id before insert
  console.log('Inserting refresh token for user.id:', user.id);

  // Store refresh token in Supabase
  const { data, error } = await supabase
    .from('RefreshToken')
    .insert([{ token: refreshToken, userId: user.id }]);
  if (error) {
    console.error('RefreshToken insert error:', error);
  } else {
    console.log('RefreshToken insert result:', data);
  }

  return refreshToken;
};

// ---------------------- Controllers ----------------------

// Signup
exports.signupUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { username, email, password } = req.body;

  try {
    const { data: existingUser, error: selectError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    // Handle "no rows" error gracefully
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Supabase select error:', selectError);
      throw selectError;
    }

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert([{ username, email, password: hashedPassword, role: 'user' }]) // no id field
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      throw insertError;
    }

    const accessToken = generateAccessToken(newUser);
    const refreshToken = await generateRefreshToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login
exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const { data: user } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    //trying to get teamId and isLeader from the TeamPlayer table
    const { data: teamPlayerDetails, error: teamError } = await supabase
      .from('TeamPlayer')
      .select('*')
      .eq('userId', user.id);

    // const teamPlayeraData = await supabase.from('TeamPlayer').select("*").eq("teamId", teamPlayerDetails[0].teamId);
    // const teamDetails = await supabase.from('Team').select("*").eq("id", teamPlayerDetails.teamId);

    if (teamError) {
      console.error('Supabase select error:', teamError);
      throw teamError;
    }

    // Get the first team if user is in multiple teams, or null if no teams
    const userTeamDetails =
      teamPlayerDetails && teamPlayerDetails.length > 0
        ? teamPlayerDetails[0]
        : null;

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        teamDetails: userTeamDetails,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Refresh Access Token
exports.refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: 'Refresh token required' });

  try {
    const { data: storedToken } = await supabase
      .from('RefreshToken')
      .select('*')
      .eq('token', refreshToken)
      .single();

    if (!storedToken)
      return res.status(403).json({ message: 'Invalid refresh token' });

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, user) => {
        if (err)
          return res.status(403).json({ message: 'Invalid refresh token' });

        const { data: dbUser } = await supabase
          .from('User')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!dbUser) return res.status(404).json({ message: 'User not found' });

        const accessToken = generateAccessToken(dbUser);
        res.json({
          accessToken,
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout
exports.logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: 'Refresh token required' });

    await supabase.from('RefreshToken').delete().eq('token', refreshToken);

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
