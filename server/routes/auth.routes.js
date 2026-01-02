const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/logout', logout);
const User = require("../models/User");

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "name role isSuperAdmin"
    );

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json({
      user: {
        name: user.name,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        userId: user._id,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

module.exports = router;
