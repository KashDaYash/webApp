// api/search.js
const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  try {
    await connectDB();
    const { query } = req.query;

    // Agar query khali hai ya undefined hai, toh empty array bhejo
    if (!query || query.trim() === "") {
      return res.json([]);
    }

    // "Regex" search: Naam ya Username mein kahin bhi match kare (Case Insensitive)
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { first_name: { $regex: query, $options: 'i' } } // Ab beech ka naam bhi search hoga
      ]
    })
    .select('tg_id first_name username photo_url') // Sirf zaroori data lo
    .limit(20); // Max 20 results

    res.json(users);
  } catch (error) {
    console.error("Search API Error:", error);
    res.status(500).json([]);
  }
};
