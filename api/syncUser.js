const mongoose = require('mongoose');

// DB Connection (Cache system ke sath taaki bar-bar connect na ho)
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

const UserSchema = new mongoose.Schema({
  tg_id: { type: Number, required: true, unique: true },
  username: String,
  first_name: String,
  photo_url: String,
  last_seen: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = async (req, res) => {
  try {
    await connectToMongo();

    // --- FIX: Data Mapping ---
    // Telegram bhejta hai 'id', humara DB chahta hai 'tg_id'
    const body = req.body;
    const userId = body.tg_id || body.id; // Dono check karo

    if (!userId) {
       console.log("Validation Failed: No ID found in body", body);
       return res.status(400).json({ error: "User ID missing" });
    }

    // Upsert User
    const user = await User.findOneAndUpdate(
      { tg_id: userId },
      { 
        tg_id: userId, 
        username: body.username, 
        first_name: body.first_name, 
        photo_url: body.photo_url, 
        last_seen: new Date() 
      },
      { upsert: true, new: true }
    );
    
    res.status(200).json(user);

  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
};
