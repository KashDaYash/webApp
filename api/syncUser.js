// api/syncUser.js
const mongoose = require('mongoose');

// DB connection inside handler to ensure logs work
const connectToMongo = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing in Env Vars");
  await mongoose.connect(process.env.MONGO_URI);
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
    console.log("Connecting to DB...");
    await connectToMongo();
    console.log("DB Connected!");

    const { tg_id, username, first_name, photo_url } = req.body;
    
    if (!tg_id) return res.status(400).json({ error: "No User ID Provided" });

    const user = await User.findOneAndUpdate(
      { tg_id: tg_id },
      { tg_id, username, first_name, photo_url, last_seen: new Date() },
      { upsert: true, new: true }
    );
    
    console.log("User Saved:", user);
    res.json(user);
    
  } catch (error) {
    console.error("SYNC ERROR:", error); // Ye Vercel logs me dikhega
    res.status(500).json({ 
      error: "Failed to save", 
      details: error.message // Ye Frontend par alert hoga
    });
  }
};
