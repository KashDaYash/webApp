const connectDB = require('./lib/db');
const { User, Message } = require('./lib/models');
const ADMIN_ID = 1302298741; // Aapki ID

module.exports = async (req, res) => {
  await connectDB();
  const { action, target_id, requester_id } = req.body;

  if (Number(requester_id) !== ADMIN_ID) {
    return res.status(403).json({ error: "Access Denied" });
  }

  try {
    if (req.method === 'GET') {
      const users = await User.find({}).sort({ last_seen: -1 });
      return res.json(users);
    }

    if (req.method === 'POST') {
      if (action === 'toggle_verify') {
        const user = await User.findOne({ tg_id: target_id });
        if(user) {
          user.is_verified = !user.is_verified;
          await user.save();
          return res.json({ success: true, status: user.is_verified });
        }
      }
      if (action === 'delete_user') {
        await User.deleteOne({ tg_id: target_id });
        await Message.deleteMany({ $or: [{ sender_id: target_id }, { receiver_id: target_id }] });
        return res.json({ success: true });
      }
    }
    res.json({ error: "Invalid Action" });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
