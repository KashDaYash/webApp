const connectDB = require('./lib/db');
const { User } = require('./lib/models');

const BOT_TOKEN = process.env.BOT_TOKEN;
const LOGGER_ID = '-1002751673545'; 

// ➤ CHARACTERS LIST (From your Python file)
const CHARACTERS = [
  { name: "Ryuujin Kai", stars: "⭐⭐⭐⭐", hp: 100, atk: 12, def: 8, img: "https://files.catbox.moe/atwh6c.jpg" },
  { name: "Akari Yume", stars: "⭐⭐⭐", hp: 100, atk: 10, def: 6, img: "https://files.catbox.moe/qc7wvc.jpg" },
  { name: "Kurogane Raiden", stars: "⭐⭐⭐⭐⭐", hp: 100, atk: 15, def: 10, img: "https://envs.sh/Hqu.jpg" },
  { name: "Yasha Noctis", stars: "⭐⭐⭐⭐", hp: 100, atk: 11, def: 7, img: "https://envs.sh/HqT.jpg" },
  { name: "Haruto Hikari", stars: "⭐⭐", hp: 100, atk: 8, def: 5, img: "https://envs.sh/Hqd.jpg" },
  { name: "Lumina", stars: "⭐⭐", hp: 100, atk: 14, def: 6, img: "https://envs.sh/HqQ.jpg" }
];

module.exports = async (req, res) => {
  try {
    await connectDB();
    const body = req.body;
    const userId = body.tg_id || body.id;

    if (!userId) return res.status(400).json({ error: "User ID missing" });

    let user = await User.findOne({ tg_id: userId });

    if (!user) {
      // --- NEW USER: ASSIGN RANDOM CHARACTER ---
      const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

      user = await User.create({
        tg_id: userId,
        username: body.username,
        first_name: body.first_name,
        photo_url: body.photo_url,
        
        // Character Info
        character_name: char.name,
        character_image: char.img,
        character_stars: char.stars,

        // Stats from Character (Capped at 100 HP)
        hp: 100, max_hp: 100,
        defense: char.def,
        damage_min: char.atk - 2,
        damage_max: char.atk + 2,
        
        // Defaults
        energy: 20,
        coins: 100, yashi: 0, kills: 0,
        level: 1, xp: 0, exp_max: 100,
        is_verified: false, is_banned: false,
        inventory: []
      });

      // Send Log
      if (BOT_TOKEN) {
         // ... (Logger Code) ...
      }

    } else {
      // --- UPDATE EXISTING USER ---
      user.first_name = body.first_name;
      user.username = body.username;
      user.last_seen = new Date();
      
      // Fix Undefined Stats or Wrong HP
      if (!user.damage_max || user.max_hp > 100) { // Reset if bugged or old
         user.hp = 100; user.max_hp = 100;
         user.damage_min = 5; user.damage_max = 10;
         user.defense = 5; user.coins = user.gold || 100;
         if(!user.character_name) {
             const char = CHARACTERS[0]; 
             user.character_name = char.name;
             user.character_image = char.img;
         }
      }
      await user.save();
    }
    
    return res.json(user);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
