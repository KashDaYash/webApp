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

    // Ensure myId is a Number (Database match ke liye zaroori hai)
    const excludeId = myId ? parseInt(myId) : 0;

    // Database se data mango
    const users = await User.find({
      tg_id: { $ne: excludeId }, // Database level par filter
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { first_name: { $regex: query, $options: 'i' } }
      ]
    })
    .select('tg_id first_name username photo_url')
    .limit(20);

    res.json(users);
    
  } catch (error) {
    console.error("Search API Error:", error);
    res.status(500).json([]);
  }
};
