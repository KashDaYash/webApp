const connectDB = require('./lib/db');
const { User, Message } = require('./lib/models');

// ➤ SUPREME OWNER ID
const OWNER_ID = 1302298741;

module.exports = async (req, res) => {
  await connectDB();
  
  // Frontend se data lo
  const { requester_id, action, target_id } = req.body;

  // 1. SECURITY CHECK: Kya ye Admin ya Owner hai?
  const reqUser = await User.findOne({ tg_id: requester_id });
  
  // Agar user nahi mila, ya wo Admin/Owner nahi hai -> DAFA KARO
  if (!reqUser || (!reqUser.is_admin && reqUser.tg_id !== OWNER_ID)) {
    return res.status(403).json({ error: "Access Denied! You are not an Admin." });
  }

  const isOwner = (reqUser.tg_id === OWNER_ID);

  try {
    // --- LIST ALL USERS (Action: 'list') ---
    if (action === 'list') {
      // Users ko sort karo: Pehle Admins, fir Verified, fir Normal
      const users = await User.find({}).sort({ is_admin: -1, is_verified: -1, last_seen: -1 });
      return res.json(users);
    }

    // --- ACTIONS (Target ID required) ---
    if (target_id) {
      const targetUser = await User.findOne({ tg_id: target_id });
      if (!targetUser) return res.status(404).json({ error: "User not found" });

      // A. TOGGLE VERIFY (Blue Tick)
      if (action === 'toggle_verify') {
        targetUser.is_verified = !targetUser.is_verified;
        await targetUser.save();
        return res.json({ success: true, status: targetUser.is_verified });
      }

      // B. TOGGLE BAN (Block User)
      if (action === 'toggle_ban') {
        // Safety: Owner ko ban nahi kar sakte
        if (targetUser.tg_id === OWNER_ID) return res.status(400).json({ error: "Cannot ban Owner!" });
        
        targetUser.is_banned = !targetUser.is_banned;
        await targetUser.save();
        return res.json({ success: true, status: targetUser.is_banned });
      }

      // C. TOGGLE ADMIN (Make/Remove Admin) - ONLY OWNER CAN DO THIS
      if (action === 'toggle_admin') {
        if (!isOwner) return res.status(403).json({ error: "Only Owner can promote Admins." });
        
        targetUser.is_admin = !targetUser.is_admin;
        await targetUser.save();
        return res.json({ success: true, status: targetUser.is_admin });
      }

      // D. DELETE USER (Permanent)
      if (action === 'delete_user') {
        if (targetUser.tg_id === OWNER_ID) return res.status(400).json({ error: "Cannot delete Owner!" });

        await User.deleteOne({ tg_id: target_id });
        await Message.deleteMany({ 
          $or: [{ sender_id: target_id }, { receiver_id: target_id }] 
        });
        return res.json({ success: true });
      }
    }

    return res.json({ error: "Invalid Action" });

  } catch (e) {
    console.error("Admin API Error:", e);
    res.status(500).json({ error: e.message });
  }
};
