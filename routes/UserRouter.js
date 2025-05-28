const express = require("express");
const User = require("../db/userModel");
const router = express.Router();
const mongoose = require("mongoose");

// GET /user/list - Return minimal user info for sidebar
router.get("/list", async (req, res) => {
  try {
    const users = await User.find({}, "_id first_name last_name");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /user/:id - Return detailed user info
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  try {
    const user = await User.findById(id).select("_id first_name last_name location description occupation");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;