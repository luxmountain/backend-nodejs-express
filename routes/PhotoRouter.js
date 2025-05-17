const express = require("express");
const Photo = require("../db/photoModel");
const mongoose = require("mongoose");
const User = require("../db/userModel");
const router = express.Router();

router.post("/", async (request, response) => {
  
});

router.get("/", async (request, response) => {
  
});

// GET /photosOfUser/:id - Return all photos for a user with comments and minimal user info
router.get("/photosOfUser/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  try {
    const photos = await Photo.find({ user_id: id });
    // For each photo, populate comments with minimal user info
    const result = await Promise.all(photos.map(async (photo) => {
      const comments = await Promise.all((photo.comments || []).map(async (comment) => {
        const user = await User.findById(comment.user_id).select("_id first_name last_name");
        return {
          _id: comment._id,
          comment: comment.comment,
          date_time: comment.date_time,
          user: user ? { _id: user._id, first_name: user.first_name, last_name: user.last_name } : null
        };
      }));
      return {
        _id: photo._id,
        user_id: photo.user_id,
        file_name: photo.file_name,
        date_time: photo.date_time,
        comments
      };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
