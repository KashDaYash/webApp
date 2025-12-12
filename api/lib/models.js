const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  tg_id: { type: Number, required: true, unique: true },
  username: String,
  first_name: String,
  photo_url: String, // User's Telegram Photo
  
  // --- Game Profile (Based on Python Bot) ---
  character_name: String, // e.g. "Ryuujin Kai"
  character_image: String, // Character Image URL
  character_stars: String, // e.g. "✪✪✪✪"
  character_quote: String,
  character_ability: String,

  // --- Stats ---
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  exp_max: { type: Number, default: 100 },
  
  hp: { type: Number, default: 100 },
  max_hp: { type: Number, default: 100 },
  defense: { type: Number, default: 10 },
  damage_min: { type: Number, default: 5 },
  damage_max: { type: Number, default: 10 },
  
  energy: { type: Number, default: 20 },
  
  // --- Currency & Progress ---
  coins: { type: Number, default: 100 }, // Gold/Coins
  yashi: { type: Number, default: 0 },   // Premium Currency
  kills: { type: Number, default: 0 },
  
  // --- Inventory & Pets ---
  inventory: [{ name: String, type: String, value: Number, icon: String }],
  pets: [{ name: String, level: Number, hp: Number, attack: Number, xp: Number }],

  // --- System ---
  is_banned: { type: Boolean, default: false },
  is_admin: { type: Boolean, default: false },
  joined_date: { type: Date, default: Date.now },
  last_seen: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.models.User || mongoose.model('User', UserSchema)
};
