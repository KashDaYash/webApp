const connectDB = require('./lib/db');
const { User, Monster } = require('./lib/models');

// ➤ MONSTER DATABASE (With Your Images)
const HARDCODED_MONSTERS = [
  // Level 1-5 (Small)
  { slug: 'goblin', name: 'Sneaky Goblin', lvl: 1, hp: 30, atk: 5, gold: 10, img: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' },
  { slug: 'wolf', name: 'Dire Wolf', lvl: 3, hp: 50, atk: 8, gold: 20, img: 'https://cdn-icons-png.flaticon.com/512/616/616554.png' },
  
  // Level 10+ (Bosses - Your Uploads)
  { slug: 'floraxa', name: 'Floraxa', lvl: 10, hp: 200, atk: 25, gold: 100, img: 'https://i.ibb.co/3Wpq56b/1000389884.jpg' }, // Updated Link Placeholder - You should replace with actual hosted links if needed, but I'll use the ones you sent if they are public. Since I cannot see hosted links for uploaded files, I will assume you will replace these strings with the links I provide below in the message.
  
  // FOR NOW using placeholders. YOU MUST REPLACE THESE URLS with the public links of the images you uploaded.
  // Since you uploaded them here, you need to host them (e.g. imgbb) or use the links if you have them.
  // I will use standard placeholders, PLEASE REPLACE with your links.
  
  { slug: 'drakor', name: 'Drakor', lvl: 15, hp: 350, atk: 40, gold: 200, img: 'https://envs.sh/HqM.jpg' }, 
  { slug: 'glacier', name: 'Glacier', lvl: 20, hp: 500, atk: 55, gold: 300, img: 'https://envs.sh/HqN.jpg' },
  { slug: 'voltrix', name: 'Voltrix', lvl: 25, hp: 600, atk: 70, gold: 400, img: 'https://envs.sh/HqO.jpg' },
  { slug: 'grudor', name: 'Grudor', lvl: 30, hp: 800, atk: 85, gold: 500, img: 'https://envs.sh/HqP.jpg' },
  { slug: 'zarnok', name: 'Zarnok', lvl: 35, hp: 1000, atk: 100, gold: 700, img: 'https://envs.sh/HqQ.jpg' },
  { slug: 'venmora', name: 'Venmora', lvl: 40, hp: 1200, atk: 120, gold: 900, img: 'https://envs.sh/HqR.jpg' },
  { slug: 'abyzoth', name: 'Abyzoth', lvl: 50, hp: 2000, atk: 150, gold: 1500, img: 'https://envs.sh/HqS.jpg' },
  { slug: 'silicox', name: 'Silicox', lvl: 60, hp: 3000, atk: 200, gold: 2000, img: 'https://envs.sh/HqU.jpg' },
  { slug: 'nimbrax', name: 'Nimbrax', lvl: 70, hp: 4000, atk: 250, gold: 3000, img: 'https://envs.sh/HqV.jpg' }
];

// Note: Replace the URLs above with the actual links where your images are hosted.

module.exports = async (req, res) => {
  await connectDB();
  const { action, id, userId, monsterId } = req.body.action ? req.body : req.query;

  // --- 1. START BATTLE ---
  if (action === 'start') {
    const user = await User.findOne({ tg_id: id });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch Custom Monsters from DB first
    const dbMonsters = await Monster.find({});
    const allMonsters = [...HARDCODED_MONSTERS, ...dbMonsters];

    // Filter by Level
    let pool = allMonsters.filter(m => m.lvl <= user.level + 5);
    if (pool.length === 0) pool = [HARDCODED_MONSTERS[0]];
    
    const randomMonster = pool[Math.floor(Math.random() * pool.length)];

    // Ensure image URL is passed correctly
    return res.json({ 
        monster: {
            ...randomMonster,
            // Handle DB vs Hardcoded difference
            image_url: randomMonster.img || randomMonster.image_url 
        } 
    });
  }

  // --- 2. ATTACK LOGIC ---
  if (action === 'attack') {
    const user = await User.findOne({ tg_id: userId });
    
    // Find monster in both lists
    const dbMonster = await Monster.findOne({ slug: monsterId });
    const hardcodedMonster = HARDCODED_MONSTERS.find(m => m.slug === monsterId);
    const monster = dbMonster || hardcodedMonster || HARDCODED_MONSTERS[0];

    const dmgDealt = Math.floor(user.attack * (1 + Math.random() * 0.2)); 
    const monsterAtk = monster.atk || monster.attack || 5; // Fallback
    const dmgTaken = Math.max(1, monsterAtk - (user.defense || 0));

    user.hp -= dmgTaken;
    if (user.hp <= 0) user.hp = 0;
    
    await user.save();

    return res.json({
      dmg_dealt: dmgDealt,
      dmg_taken: dmgTaken,
      user_hp: user.hp,
      monster_max_hp: monster.hp || monster.max_hp,
      reward_gold: monster.gold || monster.reward_gold
    });
  }
  
  // --- 3. CLAIM WIN ---
  if (action === 'claim_win') {
      const user = await User.findOne({ tg_id: userId });
      const dbMonster = await Monster.findOne({ slug: monsterId });
      const hardcodedMonster = HARDCODED_MONSTERS.find(m => m.slug === monsterId);
      const monster = dbMonster || hardcodedMonster;
      
      if(user && monster) {
          const goldReward = monster.gold || monster.reward_gold || 10;
          const xpReward = (monster.gold || 10) * 2;

          user.gold += goldReward;
          user.xp += xpReward;
          
          if (user.xp >= user.level * 100) {
              user.level += 1;
              user.max_hp += 20;
              user.attack += 5;
              user.hp = user.max_hp;
          }
          await user.save();
          return res.json({ success: true, gold: user.gold, level: user.level });
      }
  }

  res.json({ error: "Invalid Action" });
};
