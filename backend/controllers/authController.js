const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../middleware/requireAuth');

const createAuthResponse = (user) => ({
  success: true,
  token: jwt.sign({ sub: user._id.toString() }, getJwtSecret(), { expiresIn: '7d' }),
  user: {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  },
});

exports.register = async (req, res, next) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!name || !email || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Name, valid email, and a password of at least 8 characters are required',
    });
  }
  if (name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid name and email' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please log in.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    getJwtSecret();
    const user = await User.findOne({ email }).select('+password +passwordHash');
    const storedPassword = user && (user.password || user.passwordHash);
    if (!user || !storedPassword || !(await bcrypt.compare(password, storedPassword))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    return res.status(200).json(createAuthResponse(user));
  } catch (error) {
    return next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('name email');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account no longer exists' });
    }
    return res.status(200).json({
      success: true,
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (error) {
    return next(error);
  }
};
