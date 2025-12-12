const connectDB = require('./lib/db');
const { User, Monster } = require('./lib/models');

// ➤ MONSTERS LIST (Fixed Images)
const ENEMIES = [
  // --- Small Mobs ---
  { 
    slug: 'goblin', name: 'Sneaky Goblin', hp: 30, atk: [3, 5], coins: 10, 
    img: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' 
  },
  { 
    slug: 'wolf', name: 'Dire Wolf', hp: 50, atk: [5, 8], coins: 20, 
    img: 'https://cdn-icons-png.flaticon.com/512/616/616554.png' 
  },

  // --- BOSSES (Your Links) ---
  { 
    slug: 'silicox', name: 'Silicox', hp: 140, atk: [9, 12], coins: 105, 
    img: 'https://files.catbox.moe/rnad1x.jpg' 
  },
  { 
    slug: 'drakor', name: 'Drakor', hp: 150, atk: [10, 13], coins: 110, 
    img: 'https://files.catbox.moe/yjqp8n.jpg' 
  },
  { 
    slug: 'grudor', name: 'Grudor', hp: 160, atk: [7, 10], coins: 115, 
    img: 'https://files.catbox.moe/5xprol.jpg' 
  },
  { 
    slug: 'zarnok', name: 'Zarnok', hp: 135, atk: [11, 14], coins: 120, 
    img: 'https://files.catbox.moe/avzr6a.jpg' 
  },
  { 
    slug: 'venmora', name: 'Venmora', hp: 136, atk: [10, 13], coins: 100, 
    img: 'https://files.catbox.moe/2gjal5.jpg' 
  },
  { 
    slug: 'abyzoth', name: 'Abyzoth', hp: 148, atk: [12, 15], coins: 130, 
    img: 'https://files.catbox.moe/xdwbyu.jpg' 
  },
  { 
    slug: 'floraxa', name: 'Floraxa', hp: 155, atk: [13, 16], coins: 140, 
    img: 'https://files.catbox.moe/msdb4a.jpg' 
  },
  { 
    slug: 'nimbrax', name: 'Nimbrax', hp: 155, atk: [13, 16], coins: 140, 
    img: 'https://files.catbox.moe/pxe6dd.jpg' 
  }
];

// Helper: Random Integer
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = async (req, res) => {
  await connectDB();
  
  // Handle both POST and GET properly
  const method = req.method;
  const body = method === 'POST' ? req.body : req.query;
  const { action, id, userId, monsterId } = body;

  try {
    // --- 1. START BATTLE (GET/POST) ---
    if (action === 'start' || (method === 'GET' && action === 'start')) {
      const targetId = id || userId;
      if(!targetId) return res.status(400).json({ error: "No User ID" });

      const user = await User.findOne({ tg_id: targetId });
      if (!user) return res.status(404).json({ error: "User not found" });

      // Pick Random Monster
      const enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];

      // Send cleanly structured data
      return res.json({ 
          monster: {
              slug: enemy.slug,
              name: enemy.name,
              hp: enemy.hp,
              max_hp: enemy.hp,
              img: enemy.img, // Image URL is vital here
              image_url: enemy.img 
          } 
      });
    }

    // --- 2. ATTACK ---
    if (action === 'attack') {
      const user = await User.findOne({ tg_id: userId });
      const enemy = ENEMIES.find(m => m.slug === monsterId) || ENEMIES[0];

      // Player Dmg
      const pMin = user.damage_min || 5;
      const pMax = user.damage_max || 10;
      const playerDmg = rand(pMin, pMax);

      // Enemy Dmg
      const eMin = enemy.atk[0];
      const eMax = enemy.atk[1];
      let enemyDmg = rand(eMin, eMax);

      // Defense
      const def = user.defense || 0;
      enemyDmg = Math.max(1, Math.floor(enemyDmg - (def / 10)));

      user.hp -= enemyDmg;
      if (user.hp < 0) user.hp = 0;
      await user.save();

      return res.json({
        dmg_dealt: playerDmg,
        dmg_taken: enemyDmg,
        user_hp: user.hp,
        user_coins: user.coins,
        monster_name: enemy.name,
        reward_coins: enemy.coins,
        msg: `You hit ${playerDmg}. It hit ${enemyDmg}.`
      });
    }
    
    // --- 3. CLAIM WIN ---
    if (action === 'claim_win') {
        const user = await User.findOne({ tg_id: userId });
        const enemy = ENEMIES.find(m => m.slug === monsterId);
        
        if(user && enemy) {
            const xpGain = rand(10, 20);
            const coinsGain = enemy.coins;
            
            user.coins += coinsGain;
            user.xp += xpGain;
            
            // Level Up
            let levelUp = false;
            if (user.xp >= user.exp_max) {
                user.level += 1;
                user.xp = 0;
                user.exp_max = Math.floor(user.exp_max * 1.3);
                user.max_hp += 10;
                user.hp = user.max_hp;
                levelUp = true;
            }
            await user.save();
            return res.json({ success: true, coins: coinsGain, xp: xpGain, levelUp: levelUp });
        }
    }

    return res.json({ error: "Unknown action" });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};
