const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password in queries by default
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },
  institution: {
    type: String,
    maxlength: [200, 'Institution name cannot exceed 200 characters'],
    default: ''
  },
  country: {
    type: String,
    maxlength: [50, 'Country cannot exceed 50 characters'],
    default: 'IN'
  },
  // Educational details
  degree: {
    type: String,
    maxlength: [100, 'Degree cannot exceed 100 characters'],
    default: ''
  },
  branch: {
    type: String,
    maxlength: [100, 'Branch cannot exceed 100 characters'],
    default: ''
  },
  graduationYear: {
    type: Number,
    default: null
  },
  // Platform connections - store usernames/handles
  platforms: {
    leetcode: { type: String, default: null },
    github: { type: String, default: null },
    codeforces: { type: String, default: null },
    codechef: { type: String, default: null },
    geeksforgeeks: { type: String, default: null },
    hackerrank: { type: String, default: null },
    codingninjas: { type: String, default: null }
  },
  // OAuth fields
  oauthProvider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  oauthId: {
    type: String,
    default: null
  },
  // Privacy and notification settings
  settings: {
    publicProfile: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true },
    roomInvites: { type: Boolean, default: true }
  },
  // Rooms/Societies the user is part of
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastSynced: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  // If password wasn't modified, do nothing.
  if (!this.isModified('password')) {
    return;
  }

  // In async pre hooks avoid calling `next()` — throw on error so Mongoose handles it.
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, username: this.username, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = mongoose.model('User', userSchema);
