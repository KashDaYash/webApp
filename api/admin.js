const connectDB = require('./lib/db');
const { User, Message } = require('./lib/models');

const ADMIN_ID = 1302298741; // Aapki ID

module.exports = async (req, res) => {
  await connectDB();
  const { action, target_id, requester_id } = req.body;

  // 1. SECURITY CHECK (Sirf aap access kar sakte hain)
  if (Number(requester_id) !== ADMIN_ID) {
    return res.status(403).json({ error: "Access Denied! You are not Admin." });
  }

  try {
    // --- LIST ALL USERS ---
    if (req.method === 'GET') {
      // Saare users laao, naye wale sabse upar
      const users = await User.find({}).sort({ last_seen: -1 });
      return res.json(users);
    }

    // --- ACTIONS (POST) ---
    if (req.method === 'POST') {
      
      // A. Give/Remove Blue Tick
      if (action === 'toggle_verify') {
        const user = await User.findOne({ tg_id: target_id });
        if(user) {
          user.is_verified = !user.is_verified; // True ko False, False ko True
          await user.save();
          return res.json({ success: true, status: user.is_verified });
        }
      }

      // B. Delete User (Ban)
      if (action === 'delete_user') {
        // User ko udao
        await User.deleteOne({ tg_id: target_id });
        // Uske saare messages bhi udao
        await Message.deleteMany({ 
          $or: [{ sender_id: target_id }, { receiver_id: target_id }] 
        });
        return res.json({ success: true });
      }
    }

    res.json({ error: "Invalid Action" });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
