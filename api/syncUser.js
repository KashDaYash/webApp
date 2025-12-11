const mongoose = require('mongoose');
const BOT_TOKEN = process.env.BOT_TOKEN;
const LOGGER_ID = 'KashDaYashLogs'; // Aapka Logger Group ID

// --- DB CONNECTION ---
let isConnected = false;
const connectToMongo = async () => {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
};

// --- SCHEMA ---
const UserSchema = new mongoose.Schema({
  tg_id: { type: Number, required: true, unique: true },
  username: String,
  first_name: String,
  photo_url: String,
  last_seen: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- MAIN HANDLER ---
module.exports = async (req, res) => {
  try {
    await connectToMongo();

    const body = req.body;
    const userId = body.tg_id || body.id;

    if (!userId) {
       return res.status(400).json({ error: "User ID missing" });
    }

    // 1. Check if user already exists
    let user = await User.findOne({ tg_id: userId });

    if (user) {
      // --- EXISTING USER: Update Data Only ---
      user.username = body.username;
      user.first_name = body.first_name;
      user.photo_url = body.photo_url;
      user.last_seen = new Date();
      await user.save();
      
    } else {
      // --- NEW USER: Create & Send Alert ---
      user = await User.create({
        tg_id: userId,
        username: body.username,
        first_name: body.first_name,
        photo_url: body.photo_url,
        last_seen: new Date()
      });

      // Send Alert to Telegram Logger
      if (BOT_TOKEN) {
        const userLink = body.username ? `https://t.me/${body.username}` : `tg://user?id=${userId}`;
        const caption = `
🆕 <b>New User Joined!</b>

👤 <b>Name:</b> <a href="${userLink}">${body.first_name}</a>
🆔 <b>ID:</b> <code>${userId}</code>
🏷 <b>Username:</b> ${body.username ? '@' + body.username : 'None'}
        `;

        try {
          // Agar Photo hai to Photo bhejo, nahi to Text
          if (body.photo_url) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: LOGGER_ID,
                photo: body.photo_url,
                caption: caption,
                parse_mode: 'HTML'
              })
            });
          } else {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: LOGGER_ID,
                text: caption,
                parse_mode: 'HTML'
              })
            });
          }
        } catch (err) {
          console.error("Logger Alert Failed:", err);
        }
      }
    }
    
    res.status(200).json(user);

  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
};
