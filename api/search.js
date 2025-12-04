// api/search.js
const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  try {
    await connectDB();
    
    // Frontend se 'query' aur 'myId' dono receive karo
    const { query, myId } = req.query;

    if (!query || query.trim() === "") {
      return res.json([]);
    }

    const searchCondition = {
      // 1. Khud ko exclude karo (Not Equal to myId)
      tg_id: { $ne: myId },
      
      // 2. Naam ya Username match karo
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
    console.error("Search API Error:", error);
    res.status(500).json([]);
  }
};
