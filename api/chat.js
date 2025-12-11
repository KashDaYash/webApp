const connectDB = require('./lib/db');
const { Message, User } = require('./lib/models');
const BOT_TOKEN = process.env.BOT_TOKEN;

// ➤ AAPKI ADMIN ID (Yahan set kar di hai)
const ADMIN_ID = 1302298741; 

module.exports = async (req, res) => {
  await connectDB();

  // --- 1. DELETE MESSAGE (Feature 4) ---
  if (req.method === 'DELETE') {
    const { message_id, user_id } = req.body;
    
    // Security Check: Kya message usi ka hai?
    const msg = await Message.findOne({ _id: message_id });
    
    if (!msg) return res.status(404).json({ error: "Message not found" });
    
    // Sirf Sender ya Admin hi delete kar sake
    if (msg.sender_id !== user_id && user_id !== ADMIN_ID) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    await Message.deleteOne({ _id: message_id });
    return res.json({ success: true });
  }

  // --- 2. SEND MESSAGE ---
  if (req.method === 'POST') {
    const { sender_id, receiver_id, text } = req.body;
    const msg = await Message.create({ 
      sender_id, 
      receiver_id, 
      text,
      is_read: false 
    });

    if (BOT_TOKEN) {
      try {
        const sender = await User.findOne({ tg_id: sender_id });
        const name = sender ? sender.first_name : "User";
        
        // Feature 5: Admin Notification Style
        const title = (sender_id === ADMIN_ID) ? "👑 <b>Admin Message:</b>" : `📩 <b>${name}:</b>`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: receiver_id, 
            text: `${title}\n\n<i>"${text}"</i>\n\n👇 Open App to reply.`,
            parse_mode: 'HTML'
          })
        });
      } catch (e) {}
    }
    return res.json(msg);
  }

  // --- 3. MARK READ ---
  if (req.method === 'PUT') {
    const { myId, partnerId } = req.body;
    await Message.updateMany(
      { sender_id: partnerId, receiver_id: myId, is_read: false },
      { $set: { is_read: true } }
    );
    return res.json({ success: true });
  }

  // --- 4. GET DATA ---
  const { u1, u2, type, myId } = req.query;

  // A. Chat Room Data
  if (u1 && u2) {
    const msgs = await Message.find({
      $or: [
        { sender_id: u1, receiver_id: u2 },
        { sender_id: u2, receiver_id: u1 }
      ]
    }).sort({ timestamp: 1 });

    const partner = await User.findOne({ tg_id: u2 }).select('last_seen first_name tg_id');
    
    // Check if partner is Admin
    const pData = partner ? partner.toObject() : {};
    if (pData.tg_id === ADMIN_ID) pData.is_admin = true;

    return res.json({ messages: msgs, partner: pData });
  }

  // B. Chat List Data
  if (type === 'list' && myId) {
    const uid = Number(myId);
    
    const msgs = await Message.find({
      $or: [{ sender_id: uid }, { receiver_id: uid }]
    }).sort({ timestamp: -1 }).limit(200);

    const partnerIds = new Set();
    msgs.forEach(m => partnerIds.add(m.sender_id === uid ? m.receiver_id : m.sender_id));

    const partners = Array.from(partnerIds);
    let users = await User.find({ tg_id: { $in: partners } }).lean();

    // Loop through users to add Badges & Counts
    for (let user of users) {
      user.unread_count = await Message.countDocuments({
        sender_id: user.tg_id, receiver_id: uid, is_read: false
      });
      // Admin Check for List
      if (user.tg_id === ADMIN_ID) user.is_admin = true;
    }

    return res.json(users);
  }

  res.json([]);
};
