const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  try {
    await connectDB();
    
    let { query, myId, page } = req.query;
    
    // Page number (Default 1)
    const pageNum = parseInt(page) || 1;
    const limit = 10;
    const skip = (pageNum - 1) * limit;

    // Ensure myId is number
    const excludeId = myId ? Number(myId) : 0;

    let filter = { tg_id: { $ne: excludeId } };

    // Agar Search Query hai to filter add karo
    if (query && query.trim() !== "") {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { first_name: { $regex: query, $options: 'i' } }
      ];
    }

    // Database Query
    // Sort by: Verify wale pehle, fir naye users (last_seen)
    const users = await User.find(filter)
      .sort({ is_verified: -1, last_seen: -1 }) 
      .skip(skip)
      .limit(limit)
      .select('tg_id first_name username photo_url is_verified is_admin is_banned');

    res.json(users);
    
  } catch (error) {
    console.error("Search API Error:", error);
    res.status(500).json([]);
  }
};
