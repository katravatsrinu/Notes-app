const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpire } = require("../config/config");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false, // Don't return password in queries
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSynced: {
    type: Date,
    default: Date.now,
  },
});

// encrypt password 
UserSchema.pre('save', async function (next) {
    if(!this.isModified('password')){
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, jwtSecret, {
    expiresIn: jwtExpire
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);