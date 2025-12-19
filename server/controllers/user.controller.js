const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users
exports.getUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

// Create user (Admin only)
exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashed,
    role
  });

  res.status(201).json({
    message: 'User created',
    user: {
      id: user._id,
      name: user.name,
      role: user.role
    }
  });
};

// Enable / Disable user
exports.toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.isSuperAdmin) {
  return res.status(403).json({ message: 'Cannot modify Super Admin' });
}

if (user._id.toString() === req.user.userId) {
  return res.status(403).json({ message: 'You cannot disable your own account' });
}


  user.active = !user.active;
  await user.save();

  res.json({ message: 'User status updated', active: user.active });
};

// Change role
exports.changeRole = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  if (user.isSuperAdmin) {
  return res.status(403).json({ message: 'Cannot change Super Admin role' });
}

if (user._id.toString() === req.user.userId) {
  return res.status(403).json({ message: 'You cannot change your own role' });
}


  user.role = req.body.role;
  await user.save();

  res.json({ message: 'User role updated' });
};
