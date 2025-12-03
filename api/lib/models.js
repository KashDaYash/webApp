// api/lib/models.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  tg_id: { type: Number, required: true, unique: true },
  username: String,
  first_name: String,
  photo_url: String,
  last_seen: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  sender_id: Number,
  receiver_id: Number,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Message: mongoose.models.Message || mongoose.model('Message', MessageSchema)
};
