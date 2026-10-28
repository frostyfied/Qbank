const User = require('../models/User');

async function listUsers(req, res) {
  const { page = 1, limit = 20, search, role } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: re }, { email: re }];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
  ]);

  res.json({
    users,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.max(1, Math.ceil(total / limitNum)) },
  });
}

async function updateRole(req, res) {
  const { role } = req.body || {};
  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Basic guard: admin cannot demote themselves (prevents locking out)
  if (String(user._id) === String(req.user._id) && role !== 'admin') {
    return res.status(400).json({ message: 'You cannot change your own role' });
  }

  user.role = role;
  await user.save();
  res.json({ user: user.toSafeJSON() });
}

module.exports = { listUsers, updateRole };