const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  try {
    await connectDB();
    const { tg_id, username, first_name, photo_url } = req.body;
    
    // VALIDATION: ID hona zaroori hai
    if (!tg_id) return res.status(400).json({ error: "Missing tg_id" });

    // UPSERT LOGIC:
    // Agar user mile -> Update karo (last_seen change karo)
    // Agar na mile -> Naya banao (Insert)
    // Purane users ko touch bhi mat karo
    const user = await User.findOneAndUpdate(
      { tg_id: tg_id }, // Is ID ko dhundo
      { 
        tg_id, 
        username, 
        first_name, 
        photo_url, 
        last_seen: new Date() 
      },
      { upsert: true, new: true } // Upsert = True (Insert if not exists)
    );
    
    res.json(user);
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
