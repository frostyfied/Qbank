const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { setAuthCookie, clearAuthCookie } = require('../middleware/authMiddleware');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const passwordHash = await bcrypt.hash(String(password), 10);
  // Role is intentionally forced to 'student' — never trust client-supplied roles.
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'student',
  });

  setAuthCookie(res, user._id);
  res.status(201).json({ user: user.toSafeJSON() });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  setAuthCookie(res, user._id);
  res.json({ user: user.toSafeJSON() });
}

async function logout(_req, res) {
  clearAuthCookie(res);
  res.json({ message: 'Logged out successfully' });
}

async function me(req, res) {
  // authRequired already guarantees req.user
  res.json({ user: req.user.toSafeJSON() });
}

module.exports = { register, login, logout, me };