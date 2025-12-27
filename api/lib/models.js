const mongoose = require('mongoose');

// --- USER SCHEMA ---
const UserSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  name: String,
  username: String,
  avatar: String,
  
  // Game Stats
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  max_xp: { type: Number, default: 100 },
  coins: { type: Number, default: 100 },
  
  // Combat Stats
  hp: { type: Number, default: 100 },
  max_hp: { type: Number, default: 100 },
  attack: { type: Number, default: 10 },
  defense: { type: Number, default: 5 },
  speed: { type: Number, default: 10 },
  
  // Collections
  selectedCharacter: { type: String, default: 'Default Hero' },
  ownedCharacters: [String],
  pets: [String],
  inventory: [{ 
    name: String, 
    category: String, 
    power: Number,
    description: String 
  }],
  
  // Settings
  theme: { type: String, default: 'dark' }, // 'light' or 'dark'
  last_seen: { type: Date, default: Date.now },
  is_banned: { type: Boolean, default: false },
  is_owner: { type: Boolean, default: false }
});

// --- SHOP ITEM SCHEMA ---
const ItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String, // Fruits, Potions, Armor, Weapons
  power: Number, // Effect value
  image: String
});

// --- MONSTER SCHEMA ---
const MonsterSchema = new mongoose.Schema({
  name: String,
  level: Number,
  hp: Number,
  attack: Number,
  image: String,
  xp_reward: Number,
  coin_reward: Number
});

module.exports = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Item: mongoose.models.Item || mongoose.model('Item', ItemSchema),
  Monster: mongoose.models.Monster || mongoose.model('Monster', MonsterSchema)
};
