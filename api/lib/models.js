const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  tg_id: { type: Number, required: true, unique: true },
  username: String,
  first_name: String,
  photo_url: String, // Telegram Photo
  
  // --- RPG Character Info ---
  character_name: String,   // e.g. Ryuujin Kai
  character_image: String,  // Character Photo URL
  character_class: String,  // e.g. Assassin/Mage
  
  // --- Battle Stats ---
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  max_xp: { type: Number, default: 100 },
  
  hp: { type: Number, default: 100 },
  max_hp: { type: Number, default: 100 },
  energy: { type: Number, default: 20 },
  
  attack: { type: Number, default: 10 },
  defense: { type: Number, default: 5 },
  speed: { type: Number, default: 5 }, // For Dodge chance
  
  // --- Economy ---
  coins: { type: Number, default: 100 },
  inventory: [{ 
    slug: String, 
    name: String, 
    type: String, 
    power: Number 
  }],

  // --- System ---
  is_banned: { type: Boolean, default: false },
  is_admin: { type: Boolean, default: false },
  last_seen: { type: Date, default: Date.now }
});

// Admin Monster Storage (Optional, mostly we use hardcoded for speed)
const MonsterSchema = new mongoose.Schema({
  slug: String, name: String, hp: Number, attack: Number, image_url: String
});

module.exports = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Monster: mongoose.models.Monster || mongoose.model('Monster', MonsterSchema)
};
