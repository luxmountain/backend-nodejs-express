const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  login_name: { 
    type: String, 
    required: true,
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  first_name: { 
    type: String, 
    required: true 
  },
  last_name: { 
    type: String, 
    required: true 
  },
  location: { type: String },
  description: { type: String },
  occupation: { type: String },
  created_date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model.Users || mongoose.model("Users", userSchema);
