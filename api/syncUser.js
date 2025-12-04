const mongoose = require('mongoose');

// Schema Definition
const UserSchema = new mongoose.Schema({
  tg_id: { type: Number, required: true, unique: true },
  username: String,
  first_name: String,
  photo_url: String,
  last_seen: { type: Date, default: Date.now }
});

// Model (Singleton pattern for Serverless)
const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = async (req, res) => {
  // 1. Check if Env Var exists
  if (!process.env.MONGO_URI) {
    return res.status(500).json({ 
      error: "Config Error", 
      details: "MONGO_URI variable Vercel me nahi mila!" 
    });
  }

  try {
    // 2. Connection Attempt
    if (mongoose.connection.readyState === 0) {
      console.log("Connecting to MongoDB...");
      // Timeout settings add ki hain taaki jaldi error dikhe
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000 
      });
      console.log("Connected!");
    }

    // 3. Data Saving
    const { tg_id, username, first_name, photo_url } = req.body;
    
    if (!tg_id) {
       return res.status(400).json({ error: "Validation Error", details: "User ID missing" });
    }

    const user = await User.findOneAndUpdate(
      { tg_id: tg_id },
      { tg_id, username, first_name, photo_url, last_seen: new Date() },
      { upsert: true, new: true }
    );
    
    // Success Response
    res.status(200).json(user);

  } catch (error) {
    console.error("DB Connection Error:", error);
    
    // Yahan hum asli error bhej rahe hain frontend ko
    res.status(500).json({ 
      error: "DB Connection Failed", 
      details: error.message // Ye line screen par error print karegi
    });
  }
};
