// api/search.js
const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  try {
    await connectDB();
    const { query } = req.query;

    if (!query) return res.json([]);

    // Search logic: Username YA First Name me dhundo
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },   // Case insensitive username
        { first_name: { $regex: query, $options: 'i' } }  // Case insensitive name
      ]
    }).limit(20);

    res.json(users);
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json([]);
  }
};
