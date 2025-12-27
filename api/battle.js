const connectDB = require('./lib/db');
const { User, Monster } = require('./lib/models');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = async (req, res) => {
  await connectDB();
  const { action, telegramId, mode, targetId } = req.body;

  const user = await User.findOne({ telegramId });
  if (!user) return res.status(404).json({ error: "User not found" });

  // --- 1. FIND MATCH (PvP or PvM) ---
  if (action === 'find_match') {
    if (mode === 'pvm') {
      // Find Monster near user level
      const monsters = await Monster.find({});
      const monster = monsters.length > 0 ? monsters[Math.floor(Math.random() * monsters.length)] : {
        name: "Wild Goblin", hp: 50, attack: 5, level: 1, xp_reward: 10, coin_reward: 5, image: "https://cdn-icons-png.flaticon.com/512/3062/3062634.png"
      };
      return res.json({ type: 'pvm', enemy: monster });
    } 
    
    if (mode === 'pvp') {
      // Matchmaking: Level ± 1
      const opponent = await User.findOne({
        telegramId: { $ne: user.telegramId },
        level: { $gte: user.level - 1, $lte: user.level + 1 }
      });

      if (!opponent) return res.json({ error: "No opponent found nearby!" });
      
      return res.json({ 
        type: 'pvp', 
        enemy: { 
          name: opponent.name, 
          hp: opponent.hp, 
          attack: opponent.attack, 
          image: opponent.avatar,
          telegramId: opponent.telegramId 
        } 
      });
    }
  }

  // --- 2. BATTLE TURN ---
  if (action === 'attack') {
    // Simple turn logic
    const dmg = Math.floor(user.attack * (1 + Math.random() * 0.2));
    // Enemy dmg logic handled on frontend or stored session for simplicity in this demo
    return res.json({ dmg: dmg });
  }

  // --- 3. BATTLE RESULT ---
  if (action === 'result') {
    const { win, type } = req.body;
    
    if (win) {
      user.xp += 5;
      user.coins += 10; // Base reward
      
      // Level Up Logic
      if (user.xp >= user.max_xp) {
        user.level += 1;
        user.xp = 0;
        user.max_xp = Math.floor(user.max_xp * 1.5);
        user.max_hp += 10;
        user.attack += 2;
        user.hp = user.max_hp; // Heal on level up
      }
    } else {
      user.xp += 1; // Pity XP
      user.coins = Math.max(0, user.coins - 5); // Deduct coins
    }
    
    await user.save();
    return res.json({ 
      success: true, 
      user: { level: user.level, xp: user.xp, coins: user.coins, max_xp: user.max_xp } 
    });
  }
};
