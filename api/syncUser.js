const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  await connectDB();
  const body = req.body;
  const userId = body.tg_id || body.id;

  if (!userId) return res.status(400).json({ error: "User ID missing" });

  let user = await User.findOne({ tg_id: userId });

  if (!user) {
    // New User
    user = await User.create({
      tg_id: userId,
      username: body.username,
      first_name: body.first_name,
      photo_url: body.photo_url,
      // Default Game Stats
      hp: 100, max_hp: 100,
      energy: 20,
      gold: 100,
      attack: 10,
      level: 1, xp: 0
    });
  } else {
    // Existing User Update (Fix Undefined)
    user.first_name = body.first_name;
    user.username = body.username;
    user.photo_url = body.photo_url;
    user.last_seen = new Date();
    
    // Agar purane user ke paas stats nahi hain to ab de do
    if (!user.hp) {
       user.hp = 100; user.max_hp = 100;
       user.energy = 20; user.gold = 100;
       user.attack = 10; user.level = 1;
    }
    await user.save();
  }
  
  return res.json(user);
};
