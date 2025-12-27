const connectDB = require('./lib/db');
const { User } = require('./lib/models');

const OWNER_ID = process.env.OWNER_ID; // Set this in Vercel Env

module.exports = async (req, res) => {
  await connectDB();
  const userData = req.body; // Sent from Telegram.WebApp.initDataUnsafe.user

  if (!userData || !userData.id) {
    return res.status(400).json({ error: "Invalid User Data" });
  }

  let user = await User.findOne({ telegramId: userData.id });

  if (!user) {
    // New User Registration
    user = await User.create({
      telegramId: userData.id,
      name: userData.first_name,
      username: userData.username,
      avatar: userData.photo_url,
      ownedCharacters: ['Default Hero'],
      is_owner: String(userData.id) === String(OWNER_ID)
    });
  } else {
    // Update Info
    user.name = userData.first_name;
    user.username = userData.username;
    user.avatar = userData.photo_url;
    user.last_seen = new Date();
    user.is_owner = String(userData.id) === String(OWNER_ID);
    await user.save();
  }

  return res.json(user);
};
