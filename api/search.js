// api/search.js
const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  try {
    await connectDB();
    
    let { query, myId } = req.query;

    if (!query || query.trim() === "") {
      return res.json([]);
    }

    // --- FIX: ID ko Number mein convert karein ---
    // Agar myId nahi aaya to 0 maan lo taaki crash na ho
    const currentUserId = myId ? Number(myId) : 0;

    const searchCondition = {
      // Logic: Database wali tg_id (Number) !== currentUserId (Number)
      tg_id: { $ne: currentUserId },
      
      // Naam ya Username match karo
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { first_name: { $regex: query, $options: 'i' } }
      ]
    };

    const users = await User.find(searchCondition)
      .select('tg_id first_name username photo_url')
      .limit(20);

    res.json(users);
    
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json([]);
  }
};
