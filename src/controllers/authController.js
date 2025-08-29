const bcrypt = require('bcryptjs');
const jwt =require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

// Generate Tokens
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // Store refresh token in DB
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
    },
  });

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
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword, role: 'user' },
    });

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
    console.error(err);
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh Access Token
exports.refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: 'Refresh token required' });

  try {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!storedToken)
      return res.status(403).json({ message: 'Invalid refresh token' });

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, user) => {
        if (err)
          return res.status(403).json({ message: 'Invalid refresh token' });

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) return res.status(404).json({ message: 'User not found' });

        const accessToken = generateAccessToken(dbUser);
        res.json({ accessToken });
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

    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get CSRF Token
exports.getCsrfToken = (req, res) => {
  try {
    const csrfToken = req.csrfToken(); // Generate CSRF token
    res.cookie('csrf', csrfToken, {
      httpOnly: false, 
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'Strict' 
    });
    res.json({ csrfToken }); 
  } catch (err) {
    console.error('CSRF Token Error:', err);
    res.status(500).json({ message: 'Could not generate CSRF token' });
  }
};