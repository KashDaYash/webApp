const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  await connectDB();
  
  // Sort by Level Desc, then Coins Desc
  const users = await User.find({})
    .sort({ level: -1, coins: -1 })
    .limit(20)
    .select('name avatar level coins'); // Only needed fields

  res.json(users);
};
