const connectDB = require('./lib/db');
const { User } = require('./lib/models');

// ➤ MONSTER DATABASE (Aapki Photos ke naam)
const MONSTERS = [
  // Low Level (Small)
  { slug: 'goblin', name: 'Sneaky Goblin', lvl: 1, hp: 30, atk: 5, gold: 10, img: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' },
  { slug: 'wolf', name: 'Dire Wolf', lvl: 3, hp: 50, atk: 8, gold: 20, img: 'https://cdn-icons-png.flaticon.com/512/616/616554.png' },
  
  // Bosses (Aapki List)
  { slug: 'floraxa', name: 'Floraxa', lvl: 10, hp: 200, atk: 25, gold: 100, img: 'YOUR_FLORAXA_URL_HERE' },
  { slug: 'drakor', name: 'Drakor', lvl: 15, hp: 350, atk: 40, gold: 200, img: 'YOUR_DRAKOR_URL_HERE' },
  { slug: 'glacier', name: 'Glacier', lvl: 20, hp: 500, atk: 55, gold: 300, img: 'YOUR_GLACIER_URL_HERE' },
  { slug: 'voltrix', name: 'Voltrix', lvl: 25, hp: 600, atk: 70, gold: 400, img: 'YOUR_VOLTRIX_URL_HERE' },
  { slug: 'grudor', name: 'Grudor', lvl: 30, hp: 800, atk: 85, gold: 500, img: 'YOUR_GRUDOR_URL_HERE' },
  { slug: 'zarnok', name: 'Zarnok', lvl: 35, hp: 1000, atk: 100, gold: 700, img: 'YOUR_ZARNOK_URL_HERE' },
  { slug: 'venmora', name: 'Venmora', lvl: 40, hp: 1200, atk: 120, gold: 900, img: 'YOUR_VENMORA_URL_HERE' },
  { slug: 'abyzoth', name: 'Abyzoth', lvl: 50, hp: 2000, atk: 150, gold: 1500, img: 'YOUR_ABYZOTH_URL_HERE' },
  { slug: 'silicox', name: 'Silicox', lvl: 60, hp: 3000, atk: 200, gold: 2000, img: 'YOUR_SILICOX_URL_HERE' },
  { slug: 'nimbrax', name: 'Nimbrax', lvl: 70, hp: 4000, atk: 250, gold: 3000, img: 'YOUR_NIMBRAX_URL_HERE' }
];

module.exports = async (req, res) => {
  await connectDB();
  const { action, id, userId, monsterId } = req.body.action ? req.body : req.query;

  // --- 1. START BATTLE (Find Monster) ---
  if (action === 'start') {
    const user = await User.findOne({ tg_id: id });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Logic: User ke level ke hisaab se monster do
    // Level 1-5: Small Monsters
    // Level 5+: Bosses chance increases
    
    let pool = MONSTERS.filter(m => m.lvl <= user.level + 2); // Thoda strong monster bhi aa sakta hai
    if (pool.length === 0) pool = [MONSTERS[0]];
    
    const randomMonster = pool[Math.floor(Math.random() * pool.length)];

    return res.json({ monster: randomMonster });
  }

  // --- 2. ATTACK LOGIC ---
  if (action === 'attack') {
    const user = await User.findOne({ tg_id: userId });
    const monster = MONSTERS.find(m => m.slug === monsterId) || MONSTERS[0];

    // Damage Calc
    const dmgDealt = Math.floor(user.attack * (1 + Math.random() * 0.2)); 
    const dmgTaken = Math.max(1, monster.atk - (user.defense || 0));

    // Update User HP (Permanent)
    user.hp -= dmgTaken;
    
    // Death Check
    if (user.hp <= 0) {
      user.hp = 0;
      // Penalty logic can be added here
    }
    await user.save();

    // Send back data so frontend can animate
    return res.json({
      dmg_dealt: dmgDealt,
      dmg_taken: dmgTaken,
      user_hp: user.hp,
      monster_max_hp: monster.hp, // Frontend needs this to calculate %
      reward_gold: monster.gold
    });
  }
  
  // --- 3. CLAIM WIN (Frontend calls this when monster dies) ---
  if (action === 'claim_win') {
      const user = await User.findOne({ tg_id: userId });
      const monster = MONSTERS.find(m => m.slug === monsterId);
      
      if(user && monster) {
          user.gold += monster.gold;
          user.xp += monster.gold * 2; // Simple XP logic
          
          // Level Up Logic
          if (user.xp >= user.level * 100) {
              user.level += 1;
              user.max_hp += 20;
              user.attack += 5;
              user.hp = user.max_hp; // Full Heal on Level Up
          }
          await user.save();
          return res.json({ success: true, gold: user.gold, level: user.level });
      }
  }

  res.json({ error: "Invalid Action" });
};
