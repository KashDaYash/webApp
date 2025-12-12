const connectDB = require('./lib/db');
const { User } = require('./lib/models');

// ➤ CHARACTERS LIST (From your Python file)
const CHARACTERS = [
  { name: "Ryuujin Kai", stars: "⭐⭐⭐⭐", hp: 130, atk: 12, def: 8, img: "https://files.catbox.moe/atwh6c.jpg" },
  { name: "Akari Yume", stars: "⭐⭐⭐", hp: 125, atk: 10, def: 6, img: "https://files.catbox.moe/qc7wvc.jpg" },
  { name: "Kurogane Raiden", stars: "⭐⭐⭐⭐⭐", hp: 140, atk: 15, def: 10, img: "https://envs.sh/Hqu.jpg" },
  { name: "Yasha Noctis", stars: "⭐⭐⭐⭐", hp: 128, atk: 11, def: 7, img: "https://envs.sh/HqT.jpg" },
  { name: "Haruto Hikari", stars: "⭐⭐", hp: 120, atk: 8, def: 5, img: "https://envs.sh/Hqd.jpg" },
  { name: "Lumina", stars: "⭐⭐", hp: 130, atk: 14, def: 6, img: "https://envs.sh/HqQ.jpg" }
];

module.exports = async (req, res) => {
  await connectDB();
  const body = req.body;
  const userId = body.tg_id || body.id;

  if (!userId) return res.status(400).json({ error: "No ID" });

  let user = await User.findOne({ tg_id: userId });

  // Helper to pick random char
  const randomChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

  if (!user) {
    // --- NEW USER ---
    user = await User.create({
      tg_id: userId,
      username: body.username,
      first_name: body.first_name,
      photo_url: body.photo_url,
      
      // Assign Character
      character_name: randomChar.name,
      character_image: randomChar.img,
      hp: randomChar.hp, max_hp: randomChar.hp,
      attack: randomChar.atk, defense: randomChar.def,
      
      coins: 100, energy: 20, level: 1
    });
  } else {
    // --- FIX EXISTING USER (Undefined Issue) ---
    let changed = false;
    if (!user.character_name) {
       user.character_name = randomChar.name;
       user.character_image = randomChar.img;
       user.hp = randomChar.hp; user.max_hp = randomChar.hp;
       user.attack = randomChar.atk;
       changed = true;
    }
    // Update Name/Photo from Telegram
    if(body.first_name) user.first_name = body.first_name;
    if(body.photo_url) user.photo_url = body.photo_url;
    
    await user.save();
  }
  
  return res.json(user);
};
