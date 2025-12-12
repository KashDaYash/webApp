const connectDB = require('./lib/db');
const { User } = require('./lib/models');

const BOT_TOKEN = process.env.BOT_TOKEN;
const LOGGER_ID = '-1002751673545'; 

// ➤ CHARACTERS FROM YOUR PYTHON FILE
const CHARACTERS = [
  {
    name: "Ryuujin Kai", stars: "✪✪✪✪", hp: 130, damage: [10, 12], defense: 52,
    quote: "The dragon’s roar shakes the heavens!",
    ability: "• 20% dodge chance.\n• 10% double damage.",
    image: "https://files.catbox.moe/atwh6c.jpg"
  },
  {
    name: "Akari Yume", stars: "✪✪✪", hp: 125, damage: [8, 10], defense: 60,
    quote: "Dreams create reality!",
    ability: "• 30% dodge chance.\n• Heal 5 HP/turn.",
    image: "https://files.catbox.moe/qc7wvc.jpg"
  },
  {
    name: "Kurogane Raiden", stars: "✪✪✪✪✪", hp: 140, damage: [12, 15], defense: 45,
    quote: "Thunder strikes with unyielding power!",
    ability: "• 15% stun chance.\n• 150% Crit damage.",
    image: "https://envs.sh/Hqu.jpg"
  },
  {
    name: "Yasha Noctis", stars: "✪✪✪✪", hp: 128, damage: [9, 11], defense: 55,
    quote: "Darkness is just another path to power.",
    ability: "• 25% dodge chance.\n• Life steal 5 HP.",
    image: "https://envs.sh/HqT.jpg"
  },
  {
    name: "Haruto Hikari", stars: "✪✪", hp: 120, damage: [6, 8], defense: 50,
    quote: "Even the smallest light can shine!",
    ability: "• 20% dodge chance.\n• Recover 3 HP.",
    image: "https://envs.sh/Hqd.jpg"
  },
  {
    name: "Lumina", stars: "✪✪", hp: 130, damage: [14, 18], defense: 60,
    quote: "Rise through the shadows!",
    ability: "• 20% dodge chance.\n• Recover 3 HP.",
    image: "https://envs.sh/HqQ.jpg"
  }
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
        character_image: char.image,
        character_stars: char.stars,
        character_quote: char.quote,
        character_ability: char.ability,

        // Stats from Character
        hp: char.hp, max_hp: char.hp,
        defense: char.defense,
        damage_min: char.damage[0],
        damage_max: char.damage[1],
        
        // Defaults
        energy: 20,
        coins: 100, yashi: 0, kills: 0,
        level: 1, xp: 0, exp_max: 100,
        is_verified: false, is_banned: false
      });

      // Send Log
      if (BOT_TOKEN) {
         // ... (Logger Code same as before) ...
      }

    } else {
      // --- UPDATE EXISTING USER ---
      user.first_name = body.first_name;
      user.username = body.username;
      user.last_seen = new Date();
      
      // Fix Undefined Stats
      if (!user.damage_max) {
         // Fallback for old users
         user.damage_min = 5; user.damage_max = 10;
         user.defense = 10; user.coins = user.gold || 100;
         user.exp_max = 100; user.kills = 0;
         if(!user.character_name) {
             const char = CHARACTERS[0]; // Assign default
             user.character_name = char.name;
             user.character_image = char.image;
         }
      }
      await user.save();
    }
    
    return res.json(user);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
