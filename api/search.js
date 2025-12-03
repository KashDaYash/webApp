// api/search.js
const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  await connectDB();
  const { query } = req.query;

  // Agar user ne kuch nahi likha, to search mat karo
  if (!query || query.length < 1) return res.json([]);

  try {
    // "regex" use kar rahe hain pattern matching ke liye (Case Insensitive)
    const users = await User.find({
      $or: [
        { username: { $regex: "^" + query, $options: 'i' } }, // Username starts with query
        { first_name: { $regex: "^" + query, $options: 'i' } } // Name starts with query
      ]
    }).limit(10).select('tg_id username first_name photo_url'); // Sirf zaroori data bhejo

    res.json(users);
  } catch (e) {
    res.status(500).json([]);
  }
};
