const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users (ONLY Super Admin)
exports.getUsers = async (req, res) => {
  try {
    // 🔒 Allow only Super Admin
    if (!req.user || !req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Only Super Admin can view users" });
    }

    const users = await User.find().select("-password");

    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create user (ONLY Super Admin)
exports.createUser = async (req, res) => {
  try {
    // 🔒 Allow only Super Admin
    if (!req.user || !req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Only Super Admin can create users" });
    }

    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      active: true,
    });

    return res.status(201).json({
      message: "User created",
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Enable / Disable user (ONLY Super Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    // 🔒 Allow only Super Admin to perform this action
    if (!req.user || !req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Only Super Admin can modify user status" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🚫 Prevent modifying another Super Admin
    if (user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Cannot modify Super Admin" });
    }

    // 🚫 Prevent Super Admin from disabling own account
    if (user._id.toString() === req.user.userId) {
      return res
        .status(403)
        .json({ message: "You cannot disable your own account" });
    }

    user.active = !user.active;
    await user.save();

    return res.json({
      message: "User status updated",
      active: user.active,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Change user role & profile fields (ONLY Super Admin)
exports.changeRole = async (req, res) => {
  try {
    // 🔒 Allow only Super Admin
    if (!req.user || !req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Only Super Admin can update users" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🚫 Prevent modifying Super Admin
    if (user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: "Cannot modify Super Admin" });
    }

    // 🚫 Prevent changing own role
    if (user._id.toString() === req.user.userId) {
      return res
        .status(403)
        .json({ message: "You cannot change your own role" });
    }

    // 📝 Update allowed fields
    if (req.body.name !== undefined) {
      user.name = req.body.name;
    }

    if (req.body.email !== undefined) {
      user.email = req.body.email.toLowerCase();
    }

    if (req.body.role !== undefined) {
      user.role = req.body.role;
    }

    await user.save();

    return res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    // Handle duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};



