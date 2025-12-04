// api/search.js
const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  try {
    await connectDB();
    
    // Frontend se 'query' aur 'myId' receive karein
    const { query, myId } = req.query;

    if (!query || query.trim() === "") {
      return res.json([]);
    }

    const searchCondition = {
      // Logic: Meri ID ko chhod kar baaki sab dhundo
      tg_id: { $ne: myId },
      
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
