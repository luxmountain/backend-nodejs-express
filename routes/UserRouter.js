const express = require("express");
const User = require("../db/userModel");
const router = express.Router();
const mongoose = require("mongoose");
const Photo = require("../db/photoModel");

// Registration (public)
router.post("/", async (req, res) => {
  try {
    const { login_name, password, first_name, last_name, location, description, occupation } = req.body;

    if (!login_name || !password || !first_name || !last_name) {
      return res.status(400).send({ error: "Required fields missing" });
    }

    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return res.status(400).send({ error: "Login name already exists" });
    }

    const user = new User({
      login_name,
      password,
      first_name,
      last_name,
      location,
      description,
      occupation
    });

    await user.save();
    res.status(201).send({ login_name: user.login_name, _id: user._id });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// GET /user/list - Return minimal user info (public, no auth)
router.get("/list", async (req, res) => {
  try {
    const users = await User.find({}, "_id first_name last_name");

    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const [photoCount, commentCountAgg] = await Promise.all([
          Photo.countDocuments({ user_id: user._id }),
          Photo.aggregate([
            { $unwind: "$comments" },
            { $match: { "comments.user_id": new mongoose.Types.ObjectId(user._id) } },
            { $count: "count" }
          ])
        ]);

        const commentCount = commentCountAgg.length > 0 ? commentCountAgg[0].count : 0;

        return {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          photoCount,
          commentCount
        };
      })
    );

    res.json(enrichedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /user/:id - Return detailed user info (public, no auth)
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

router.get("/comment/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  try {
    const result = await Photo.aggregate([
      { $unwind: "$comments" },
      { $match: { "comments.user_id": new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          _id: 0,
          photo_id: "$_id",
          file_name: 1,
          photo_date_time: "$date_time",
          comment_id: "$comments._id",
          comment_text: "$comments.comment",
          comment_date_time: "$comments.date_time"
        }
      }
    ]);

    res.json(result);
  } catch (error) {
    console.error("Error in /commentsOfUser:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
