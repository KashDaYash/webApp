const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  try {
    await connectDB();
    
    let { query, myId, page } = req.query;
    
    // Pagination
    const pageNum = parseInt(page) || 1;
    const limit = 10;
    const skip = (pageNum - 1) * limit;

    const excludeId = myId ? Number(myId) : 0;
    let filter = { tg_id: { $ne: excludeId } };

    // Search by Name
    if (query && query.trim() !== "") {
      filter.$or = [
        { username: { $regex: query, $options: 'i' } },
        { first_name: { $regex: query, $options: 'i' } }
      ];
    }

    // GAMER QUERY: Sort by High Level -> Then Verified
    const users = await User.find(filter)
      .sort({ level: -1, xp: -1 }) // Highest Level First (Leaderboard)
      .skip(skip)
      .limit(limit)
      .select('tg_id first_name username photo_url level is_verified is_admin is_banned');

    res.json(users);
    
  } catch (error) {
    console.error("Search API Error:", error);
    res.status(500).json([]);
  }
};
