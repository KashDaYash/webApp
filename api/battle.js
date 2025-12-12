const connectDB = require('./lib/db');
const { User } = require('./lib/models');

// ➤ MONSTERS (From your Python file + Images)
const MONSTERS = [
  { slug: 'goblin', name: 'Sneaky Goblin', hp: 30, atk: 5, coins: 10, img: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' },
  { slug: 'wolf', name: 'Dire Wolf', hp: 50, atk: 8, coins: 20, img: 'https://cdn-icons-png.flaticon.com/512/616/616554.png' },
  { slug: 'floraxa', name: 'Floraxa', hp: 155, atk: 15, coins: 140, img: 'https://files.catbox.moe/msdb4a.jpg' },
  { slug: 'drakor', name: 'Drakor', hp: 145, atk: 12, coins: 100, img: 'https://files.catbox.moe/yjqp8n.jpg' },
  { slug: 'glacier', name: 'Glacier', hp: 138, atk: 10, coins: 90, img: 'https://envs.sh/HqE.jpg' },
  { slug: 'grudor', name: 'Grudor', hp: 150, atk: 9, coins: 110, img: 'https://files.catbox.moe/5xprol.jpg' },
  { slug: 'zarnok', name: 'Zarnok', hp: 135, atk: 13, coins: 120, img: 'https://files.catbox.moe/avzr6a.jpg' },
  { slug: 'venmora', name: 'Venmora', hp: 136, atk: 11, coins: 100, img: 'https://files.catbox.moe/2gjal5.jpg' },
  { slug: 'abyzoth', name: 'Abyzoth', hp: 148, atk: 14, coins: 130, img: 'https://files.catbox.moe/xdwbyu.jpg' },
  { slug: 'voltrix', name: 'Voltrix', hp: 137, atk: 10, coins: 95, img: 'https://envs.sh/HC_.jpg' },
  { slug: 'nimbrax', name: 'Nimbrax', hp: 155, atk: 15, coins: 140, img: 'https://files.catbox.moe/pxe6dd.jpg' }
];

module.exports = async (req, res) => {
  await connectDB();
  const { action, userId, monsterId } = req.body;

  // 1. START BATTLE
  if (req.method === 'GET' || action === 'start') {
    // Return a random monster
    const random = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
    return res.json({ monster: random });
  }

  // 2. BATTLE ACTIONS
  const user = await User.findOne({ tg_id: userId });
  const monster = MONSTERS.find(m => m.slug === monsterId) || MONSTERS[0];

  if (!user) return res.status(404).json({ error: "User not found" });

  let dmgDealt = 0;
  let dmgTaken = 0;
  let msg = "";
  let outcome = "continue"; // continue, win, loss, fled

  // --- ATTACK ---
  if (action === 'attack') {
    dmgDealt = Math.floor(user.attack * (1 + Math.random() * 0.2));
    dmgTaken = Math.max(1, monster.atk - (user.defense * 0.2));
    msg = `You hit for ${dmgDealt}. It hit back for ${dmgTaken.toFixed(0)}.`;
  }
  
  // --- DODGE (Chance to take 0 dmg) ---
  else if (action === 'dodge') {
    const chance = Math.random();
    if (chance > 0.5) { // 50% chance
      dmgDealt = Math.floor(user.attack * 0.5); // Counter attack
      dmgTaken = 0;
      msg = `Dodged! You countered for ${dmgDealt}.`;
    } else {
      dmgDealt = 0;
      dmgTaken = monster.atk; // Full damage
      msg = `Dodge failed! You took ${dmgTaken} dmg.`;
    }
  }

  // --- HEAL ---
  else if (action === 'heal') {
    if (user.coins >= 10) {
      user.coins -= 10;
      const healAmount = 30;
      user.hp = Math.min(user.hp + healAmount, user.max_hp);
      dmgTaken = Math.floor(monster.atk * 0.5); // Still take some dmg
      msg = `Healed ${healAmount} HP (-10g). Took ${dmgTaken} dmg.`;
    } else {
      msg = "Not enough coins to heal!";
      dmgTaken = monster.atk;
    }
  }

  // --- FLEE ---
  else if (action === 'flee') {
    // 50% chance to flee
    if (Math.random() > 0.5) {
      outcome = "fled";
      msg = "You ran away safely!";
    } else {
      dmgTaken = Math.floor(monster.atk * 1.5); // Backstab damage
      msg = `Failed to run! Took ${dmgTaken} dmg.`;
    }
  }

  // Apply Changes
  if (outcome !== 'fled') {
    user.hp -= parseInt(dmgTaken);
    if (user.hp <= 0) {
      user.hp = 0;
      outcome = "loss";
      msg = "You were defeated...";
    }
  }

  await user.save();

  // Return turn data
  return res.json({
    user_hp: user.hp,
    user_coins: user.coins,
    dmg_dealt: dmgDealt,
    dmg_taken: dmgTaken,
    msg: msg,
    outcome: outcome,
    monster_max: monster.hp, // For visual bar calculation
    reward_coins: monster.coins
  });
};
