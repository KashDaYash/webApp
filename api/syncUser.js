// api/syncUser.js
const connectDB = require('./lib/db');
const { User } = require('./lib/models');

module.exports = async (req, res) => {
  await connectDB();
  const { tg_id, username, first_name, photo_url } = req.body;
  
  // Upsert: Create if not exists, update if exists
  const user = await User.findOneAndUpdate(
    { tg_id },
    { tg_id, username, first_name, photo_url, last_seen: new Date() },
    { upsert: true, new: true }
  );
  res.json(user);
};
