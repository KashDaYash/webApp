const connectDB = require('./lib/db');
const { User } = require('./lib/models');

// ➤ ENEMIES LIST (From addenemy.py + Your Images)
const ENEMIES = [
  { slug: 'goblin', name: 'Sneaky Goblin', hp: 30, atk: [3, 5], coins: 10, quote: "Hehe...", img: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' },
  { slug: 'wolf', name: 'Dire Wolf', hp: 50, atk: [5, 8], coins: 20, quote: "Grrr...", img: 'https://cdn-icons-png.flaticon.com/512/616/616554.png' },
  { slug: 'drakor', name: 'Drakor', hp: 145, atk: [10, 13], coins: 100, quote: "Flames dance at my command.", img: 'https://files.catbox.moe/yjqp8n.jpg' },
  { slug: 'glacier', name: 'Glacier', hp: 138, atk: [9, 11], coins: 90, quote: "Frozen wrath of mountains.", img: 'https://envs.sh/HqE.jpg' },
  { slug: 'grudor', name: 'Grudor', hp: 150, atk: [7, 10], coins: 110, quote: "Stone and steel.", img: 'https://files.catbox.moe/5xprol.jpg' },
  { slug: 'zarnok', name: 'Zarnok', hp: 135, atk: [11, 14], coins: 120, quote: "Shadows bend to my will.", img: 'https://files.catbox.moe/avzr6a.jpg' },
  { slug: 'venmora', name: 'Venmora', hp: 136, atk: [10, 13], coins: 100, quote: "My venom is your demise.", img: 'https://files.catbox.moe/2gjal5.jpg' },
  { slug: 'silicox', name: 'Silicox', hp: 142, atk: [9, 12], coins: 105, quote: "Electricity courses through me.", img: 'https://files.catbox.moe/rnad1x.jpg' },
  { slug: 'abyzoth', name: 'Abyzoth', hp: 148, atk: [12, 15], coins: 130, quote: "Harbinger of souls.", img: 'https://files.catbox.moe/xdwbyu.jpg' },
  { slug: 'voltrix', name: 'Voltrix', hp: 137, atk: [8, 11], coins: 95, quote: "Crystals reveal fate.", img: 'https://envs.sh/HC_.jpg' },
  { slug: 'floraxa', name: 'Floraxa', hp: 155, atk: [13, 16], coins: 140, quote: "Nature's fury.", img: 'https://files.catbox.moe/msdb4a.jpg' },
  { slug: 'nimbrax', name: 'Nimbrax', hp: 155, atk: [13, 16], coins: 140, quote: "Storms gather.", img: 'https://files.catbox.moe/pxe6dd.jpg' }
];

// Helper: Random Integer
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = async (req, res) => {
  await connectDB();
  const { action, id, userId, monsterId } = req.body.action ? req.body : req.query;

  // --- 1. HUNT (Find Enemy) ---
  if (action === 'start') {
    const user = await User.findOne({ tg_id: id });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Simple Logic: Pick random enemy
    const enemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];

    return res.json({ 
        monster: {
            slug: enemy.slug,
            name: enemy.name,
            hp: enemy.hp,
            max_hp: enemy.hp,
            quote: enemy.quote,
            image_url: enemy.img
        } 
    });
  }

  // --- 2. ATTACK (Turn Based) ---
  if (action === 'attack') {
    const user = await User.findOne({ tg_id: userId });
    const enemy = ENEMIES.find(m => m.slug === monsterId) || ENEMIES[0];

    // Player Damage Calculation
    // Using Range from User Data (from character)
    const pMin = user.damage_min || 5;
    const pMax = user.damage_max || 10;
    const playerDmg = rand(pMin, pMax);

    // Enemy Damage Calculation
    const eMin = enemy.atk[0];
    const eMax = enemy.atk[1];
    let enemyDmg = rand(eMin, eMax);

    // Defense Reduction
    const def = user.defense || 0;
    // Simple logic: Defense reduces damage by flat amount or percentage. 
    // Let's do: damage = max(1, enemyDmg - (def / 10)) to keep it balanced
    enemyDmg = Math.max(1, Math.floor(enemyDmg - (def / 10)));

    // Update User HP
    user.hp -= enemyDmg;
    if (user.hp < 0) user.hp = 0;
    await user.save();

    return res.json({
      dmg_dealt: playerDmg,
      dmg_taken: enemyDmg,
      user_hp: user.hp,
      monster_name: enemy.name,
      reward_coins: enemy.coins
    });
  }
  
  // --- 3. VICTORY (Claim) ---
  if (action === 'claim_win') {
      const user = await User.findOne({ tg_id: userId });
      const enemy = ENEMIES.find(m => m.slug === monsterId);
      
      if(user && enemy) {
          const xpGain = rand(2, 5);
          const coinsGain = rand(10, 20) + enemy.coins;
          
          user.coins += coinsGain;
          user.xp += xpGain;
          user.kills += 1;

          // Level Up Logic
          let levelUp = false;
          if (user.xp >= user.exp_max) {
              user.level += 1;
              user.xp = 0; // Reset or keep overflow
              user.exp_max = Math.floor(user.exp_max * 1.3);
              user.damage_min += 1;
              user.damage_max += 1;
              user.max_hp += 10;
              user.hp = user.max_hp; // Full Heal
              levelUp = true;
          }
          
          await user.save();
          return res.json({ success: true, coins: coinsGain, xp: xpGain, levelUp: levelUp });
      }
  }

  res.json({ error: "Invalid" });
};
