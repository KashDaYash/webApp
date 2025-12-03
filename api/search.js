// api/search.js
const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  await connectDB();
  const { query } = req.query; // Telegram username query
  const users = await User.find({ 
    username: { $regex: query, $options: 'i' } 
  }).limit(10);
  res.json(users);
};
