const connectDB = require('./lib/db');
const { User } = require('./lib/models');

const BOT_TOKEN = process.env.BOT_TOKEN;
const LOGGER_ID = '-1002751673545'; 

// ➤ YOUR CHARACTER IMAGES
const CHARACTERS = [
  "https://envs.sh/Hqd.jpg",
  "https://envs.sh/HqT.jpg",
  "https://envs.sh/Hqu.jpg",
  "https://files.catbox.moe/atwh6c.jpg",
  "https://files.catbox.moe/qc7wvc.jpg"
];

module.exports = async (req, res) => {
  try {
    await connectDB();
    const body = req.body;
    const userId = body.tg_id || body.id;

    if (!userId) return res.status(400).json({ error: "User ID missing" });

    let user = await User.findOne({ tg_id: userId });

    if (!user) {
      // Pick Random Avatar
      const randomAvatar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

      user = await User.create({
        tg_id: userId,
        username: body.username,
        first_name: body.first_name,
        // Telegram photo ya Random Game Avatar use karo
        photo_url: randomAvatar, 
        
        hp: 100, max_hp: 100,
        energy: 20,
        gold: 100,
        attack: 10,
        level: 1, xp: 0,
        is_verified: false,
        is_banned: false,
        inventory: []
      });

      // Logger Logic... (Same as before)
      if (BOT_TOKEN && LOGGER_ID) {
         // ... Send log code ...
      }

    } else {
      // Existing user: Don't change photo if already set to game avatar
      // Only update info, don't overwrite custom game avatar with Telegram photo
      user.first_name = body.first_name;
      user.username = body.username;
      user.last_seen = new Date();
      
      if (!user.hp) {
         user.hp = 100; user.max_hp = 100;
         user.energy = 20; user.gold = 100;
         user.attack = 10; user.level = 1;
         // Assign random avatar to old users too if missing
         if(!user.photo_url) user.photo_url = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      }
      await user.save();
    }
    
    return res.json(user);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
