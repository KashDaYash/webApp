const connectDB = require('./lib/db');
const { User } = require('./lib/models');

const BOT_TOKEN = process.env.BOT_TOKEN;
// ➤ AAPKA LOGGER GROUP ID (Yahan @KashDaYashLogs ki Numeric ID use karein for safety)
const LOGGER_ID = '-1002751673545'; 

module.exports = async (req, res) => {
  try {
    await connectDB();
    const body = req.body;
    const userId = body.tg_id || body.id;

    if (!userId) return res.status(400).json({ error: "User ID missing" });

    // Check if user exists
    let user = await User.findOne({ tg_id: userId });

    if (!user) {
      // --- 🆕 NEW USER JOINED ---
      user = await User.create({
        tg_id: userId,
        username: body.username,
        first_name: body.first_name,
        photo_url: body.photo_url,
        
        // Default RPG Stats
        hp: 100, max_hp: 100,
        energy: 20,
        gold: 100, // Starting Money
        attack: 10,
        level: 1, xp: 0,
        
        is_verified: false,
        is_banned: false,
        inventory: []
      });

      // --- 📢 SEND LOG TO TELEGRAM GROUP ---
      if (BOT_TOKEN && LOGGER_ID) {
        const userLink = body.username ? `https://t.me/${body.username}` : `tg://user?id=${userId}`;
        const caption = `
🆕 <b>New Player Entered the Arena!</b>

👤 <b>Name:</b> <a href="${userLink}">${body.first_name}</a>
🆔 <b>ID:</b> <code>${userId}</code>
🏷 <b>Username:</b> ${body.username ? '@' + body.username : 'None'}
💰 <b>Bonus:</b> 100 Gold Given
        `;

        try {
          // Photo hai to Photo bhejo, nahi to Text
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
        } catch (e) {
          console.error("Logger Failed:", e);
        }
      }

    } else {
      // --- 🛠 EXISTING USER (Update & Fix Stats) ---
      user.first_name = body.first_name;
      user.username = body.username;
      user.photo_url = body.photo_url;
      user.last_seen = new Date();
      
      // Fix "Undefined" for old users
      if (!user.hp && user.hp !== 0) {
         user.hp = 100; user.max_hp = 100;
         user.energy = 20; 
         if(!user.gold) user.gold = 100;
         if(!user.attack) user.attack = 10;
         if(!user.level) user.level = 1;
      }
      await user.save();
    }
    
    return res.json(user);

  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
};
