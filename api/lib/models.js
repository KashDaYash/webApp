const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  tg_id: { type: Number, required: true, unique: true },
  username: String,
  first_name: String,
  photo_url: String,
  is_verified: { type: Boolean, default: false }, // Blue Tick
  last_seen: { type: Date, default: Date.now },
  last_typed: { type: Date } // For Typing Indicator
});

const MessageSchema = new mongoose.Schema({
  sender_id: Number,
  receiver_id: Number,
  text: String,
  is_read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Message: mongoose.models.Message || mongoose.model('Message', MessageSchema)
};
