const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !user.active) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

 res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // must be true on HTTPS
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000,
});

  res.json({
    message: 'Login successful',
    user: {
      name: user.name,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin
    }
  });
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
});

  res.json({ message: 'Logged out successfully' });
};
