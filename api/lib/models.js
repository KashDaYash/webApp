const mongoose = require('mongoose');

// 1. User Schema (The Player)
const UserSchema = new mongoose.Schema({
  tg_id: { type: Number, required: true, unique: true },
  username: String,
  first_name: String,
  photo_url: String,
  
  // --- RPG Stats ---
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  max_xp: { type: Number, default: 100 }, // XP needed for next level
  gold: { type: Number, default: 50 },    // Currency
  
  // Battle Stats
  hp: { type: Number, default: 100 },      // Current Health
  max_hp: { type: Number, default: 100 },  // Max Health capacity
  attack: { type: Number, default: 10 },   // Damage dealt
  defense: { type: Number, default: 2 },   // Damage reduction
  energy: { type: Number, default: 20 },   // Stamina for fighting (regens over time)
  
  // Equipment (Currently equipped)
  equipped_weapon: { type: String, default: null }, // e.g., 'rusty_sword'
  
  // Inventory (Items owned)
  inventory: [{
    item_id: String, // e.g., 'health_potion', 'iron_sword'
    count: Number
  }],

  // Permissions
  is_admin: { type: Boolean, default: false },
  is_banned: { type: Boolean, default: false },
  last_seen: { type: Date, default: Date.now }
});

// 2. Monster Schema (Enemies)
const MonsterSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true }, // e.g., 'goblin_boss'
  name: String,        // e.g., 'Drakor the Inferno'
  image_url: String,   // URL of the image
  type: String,        // 'fire', 'water', etc.
  
  level: Number,
  hp: Number,
  max_hp: Number,
  attack: Number,
  defense: Number,
  
  reward_xp: Number,
  reward_gold: Number
});

// 3. Item Schema (Shop)
const ItemSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true }, // 'sword_1'
  name: String,
  type: String, // 'weapon', 'armor', 'potion'
  price: Number,
  effect_stat: String, // 'attack', 'hp'
  effect_value: Number,
  image_url: String
});

module.exports = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Monster: mongoose.models.Monster || mongoose.model('Monster', MonsterSchema),
  Item: mongoose.models.Item || mongoose.model('Item', ItemSchema)
};
