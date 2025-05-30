const express = require("express");
const Photo = require("../db/photoModel");
const mongoose = require("mongoose");
const User = require("../db/userModel");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: "./images/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  }
});

// Upload new photo (no auth)
router.post("/new", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    // Without auth, you might need user_id in body or something else:
    // For example, require user_id from body (you can change as needed)
    const userId = req.body.user_id;
    if (!userId) {
      return res.status(400).send({ error: "User ID is required" });
    }

    const photo = new Photo({
      file_name: req.file.filename,
      user_id: userId,
      date_time: new Date(),
      comments: []
    });

    await photo.save();
    res.status(201).send(photo);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Add comment to photo (no auth)
router.post("/commentsOfPhoto/:photo_id", async (req, res) => {
  try {
    const { comment, user_id } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).send({ error: "Comment cannot be empty" });
    }
    if (!user_id) {
      return res.status(400).send({ error: "User ID is required" });
    }

    const photo = await Photo.findById(req.params.photo_id);
    if (!photo) {
      return res.status(404).send({ error: "Photo not found" });
    }

    photo.comments.push({
      comment: comment,
      user_id: user_id,
      date_time: new Date()
    });

    await photo.save();

    // Return updated photo with populated comments
    const updatedPhoto = await Photo.findById(photo._id);
    const comments = await Promise.all((updatedPhoto.comments || []).map(async (comment) => {
      const user = await User.findById(comment.user_id).select("_id first_name last_name");
      return {
        _id: comment._id,
        comment: comment.comment,
        date_time: comment.date_time,
        user: user ? { _id: user._id, first_name: user.first_name, last_name: user.last_name } : null
      };
    }));

    res.send({
      _id: updatedPhoto._id,
      user_id: updatedPhoto.user_id,
      file_name: updatedPhoto.file_name,
      date_time: updatedPhoto.date_time,
      comments
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// GET /photosOfUser/:id - Return all photos for a user with comments (no auth)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  try {
    const userExists = await User.exists({ _id: id });
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const photos = await Photo.find({ user_id: id });
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
