const connectDB = require('./lib/db');
const { User, Monster } = require('./lib/models');

// ➤ FIXED MONSTER DATABASE (Using your uploaded images)
const HARDCODED_MONSTERS = [
  // Small Mobs
  { slug: 'goblin', name: 'Sneaky Goblin', hp: 30, atk: 5, coins: 10, img: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png' },
  { slug: 'wolf', name: 'Dire Wolf', hp: 50, atk: 8, coins: 20, img: 'https://cdn-icons-png.flaticon.com/512/616/616554.png' },

  // BOSSES (Your Images)
  { slug: 'silicox', name: 'Silicox', hp: 140, atk: 12, coins: 100, img: 'https://files.catbox.moe/rnad1x.jpg' },
  { slug: 'drakor', name: 'Drakor', hp: 150, atk: 15, coins: 120, img: 'https://files.catbox.moe/yjqp8n.jpg' },
  { slug: 'grudor', name: 'Grudor', hp: 160, atk: 10, coins: 110, img: 'https://files.catbox.moe/5xprol.jpg' },
  { slug: 'zarnok', name: 'Zarnok', hp: 135, atk: 14, coins: 115, img: 'https://files.catbox.moe/avzr6a.jpg' },
  { slug: 'venmora', name: 'Venmora', hp: 145, atk: 13, coins: 105, img: 'https://files.catbox.moe/2gjal5.jpg' },
  { slug: 'abyzoth', name: 'Abyzoth', hp: 155, atk: 16, coins: 130, img: 'https://files.catbox.moe/xdwbyu.jpg' },
  { slug: 'floraxa', name: 'Floraxa', hp: 160, atk: 14, coins: 125, img: 'https://files.catbox.moe/msdb4a.jpg' },
  { slug: 'nimbrax', name: 'Nimbrax', hp: 150, atk: 15, coins: 130, img: 'https://files.catbox.moe/pxe6dd.jpg' },
  { slug: 'glacier', name: 'Glacier', hp: 140, atk: 11, coins: 100, img: 'https://files.catbox.moe/1000389888.jpg' }, // Assuming mapped
  { slug: 'voltrix', name: 'Voltrix', hp: 138, atk: 12, coins: 100, img: 'https://files.catbox.moe/1000389679.jpg' }  // Assuming mapped
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = async (req, res) => {
  await connectDB();
  const method = req.method;
  const body = method === 'POST' ? req.body : req.query;
  const { action, id, userId, monsterId } = body;

  try {
    // 1. START HUNT (Return Random Monster)
    if (action === 'start' || (method === 'GET' && action === 'start')) {
        // Fetch DB Monsters (Added via Admin)
        const dbMonsters = await Monster.find({});
        const allMonsters = [...HARDCODED_MONSTERS, ...dbMonsters];
        
        const random = allMonsters[Math.floor(Math.random() * allMonsters.length)];
        
        return res.json({ 
            monster: {
                slug: random.slug,
                name: random.name,
                hp: random.hp,
                max_hp: random.hp, // Critical for bar calculation
                img: random.img || random.image_url || "https://placehold.co/150"
            } 
        });
    }

    // 2. COMBAT ACTION
    if (action === 'attack' || action === 'dodge' || action === 'heal' || action === 'flee') {
        const user = await User.findOne({ tg_id: userId });
        const dbMonster = await Monster.findOne({ slug: monsterId });
        const hardMonster = HARDCODED_MONSTERS.find(m => m.slug === monsterId);
        const monster = dbMonster || hardMonster || HARDCODED_MONSTERS[0];

        let msg = "";
        let playerDmg = 0;
        let enemyDmg = 0;
        let outcome = "continue";

        // Logic
        if (action === 'attack') {
            playerDmg = rand(user.damage_min || 5, user.damage_max || 10);
            enemyDmg = Math.max(1, (monster.atk || 10) - Math.floor((user.defense || 0)/5));
            msg = `You hit ${playerDmg}! It hit ${enemyDmg}.`;
        } 
        else if (action === 'dodge') {
            if (Math.random() > 0.5) {
                playerDmg = Math.floor(user.attack * 0.5);
                msg = `Dodged! Counter-attack ${playerDmg}.`;
            } else {
                enemyDmg = monster.atk || 10;
                msg = `Dodge failed! Took ${enemyDmg} dmg.`;
            }
        }
        else if (action === 'heal') {
            if (user.coins >= 10) {
                user.coins -= 10;
                user.hp = Math.min(user.hp + 30, user.max_hp);
                enemyDmg = Math.floor((monster.atk || 10) / 2);
                msg = `Healed (+30HP). Took ${enemyDmg} dmg.`;
            } else {
                msg = "Not enough coins!";
                enemyDmg = monster.atk || 10;
            }
        }
        else if (action === 'flee') {
            outcome = "fled";
            msg = "You ran away!";
        }

        // Apply Damage
        if (outcome !== 'fled') {
            user.hp -= enemyDmg;
            if (user.hp <= 0) {
                user.hp = 0;
                outcome = "loss";
                msg = "Defeated...";
            }
        }
        await user.save();

        return res.json({
            dmg_dealt: playerDmg,
            dmg_taken: enemyDmg,
            user_hp: user.hp,
            user_coins: user.coins,
            outcome: outcome,
            msg: msg,
            reward_coins: monster.coins || 10
        });
    }

    // 3. CLAIM WIN
    if (action === 'claim_win') {
        const user = await User.findOne({ tg_id: userId });
        // Find monster info for rewards
        const dbMonster = await Monster.findOne({ slug: monsterId });
        const hardMonster = HARDCODED_MONSTERS.find(m => m.slug === monsterId);
        const monster = dbMonster || hardMonster;
        
        const reward = monster ? (monster.coins || 50) : 20;
        const xp = reward; // Simple 1:1

        user.coins += reward;
        user.xp += xp;
        
        // Level up
        let levelUp = false;
        if (user.xp >= user.exp_max) {
            user.level++;
            user.xp = 0;
            user.exp_max = Math.floor(user.exp_max * 1.5);
            user.max_hp += 20;
            user.hp = user.max_hp;
            levelUp = true;
        }
        await user.save();
        return res.json({ coins: reward, xp: xp, levelUp: levelUp });
    }

    return res.json({ error: "Invalid" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
