const express = require('express');
const router = express.Router();
const User = require('../db/userModel');
const jwt = require('jsonwebtoken');
require("dotenv").config();

// Login
router.post('/login', async (req, res) => {
  try {
    const { login_name, password } = req.body;

    if (!login_name) {
      return res.status(400).send({ error: 'Login name is required' });
    }

    const user = await User.findOne({ login_name });

    if (!user || (password && user.password !== password)) {
      return res.status(400).send({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.send({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      token
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    // Since we're using JWT, actual logout happens on client side
    // by removing the token
    res.send({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

module.exports = router;
