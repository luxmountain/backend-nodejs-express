const express = require("express");
const Schema = require("../db/schemaInfo");
const router = express.Router();

router.get("/info", async (req, res) => {
  try {
    const info = await Schema.find({});
    res.status(200).json(info);
  } catch (err) {
    console.error("Error fetching schema info:", err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;