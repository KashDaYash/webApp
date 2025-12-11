const connectDB = require('./lib/db');
const { Message, User } = require('./lib/models');
const BOT_TOKEN = process.env.BOT_TOKEN;

// ➤ OWNER ID (Supreme Power)
const OWNER_ID = 1302298741; 

module.exports = async (req, res) => {
  await connectDB();

  // --- 1. DELETE MESSAGE ---
  if (req.method === 'DELETE') {
    const { message_id, user_id } = req.body;
    
    const msg = await Message.findOne({ _id: message_id });
    if (!msg) return res.status(404).json({ error: "Message not found" });
    
    // Check: User khud ka msg delete kar raha hai, ya wo Admin/Owner hai?
    const requestor = await User.findOne({ tg_id: user_id });
    const isSuperUser = requestor && (requestor.is_admin || user_id === OWNER_ID);

    if (msg.sender_id !== user_id && !isSuperUser) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    await Message.deleteOne({ _id: message_id });
    return res.json({ success: true });
  }

  // --- 2. SEND MESSAGE ---
  if (req.method === 'POST') {
    const { sender_id, receiver_id, text } = req.body;

    // A. BAN CHECK (Sabse Pehle)
    const senderUser = await User.findOne({ tg_id: sender_id });
    if (senderUser && senderUser.is_banned) {
      return res.status(403).json({ error: "You are BANNED from this app." });
    }

    // B. Save Message
    const msg = await Message.create({ 
      sender_id, receiver_id, text, is_read: false 
    });

    // C. Notification
    if (BOT_TOKEN) {
      try {
        // Notification me Title set karo
        let title = `📩 <b>${senderUser ? senderUser.first_name : 'User'}:</b>`;
        
        // Agar Owner ya Admin hai to alag title
        if (sender_id === OWNER_ID) title = "👑 <b>OWNER Message:</b>";
        else if (senderUser && senderUser.is_admin) title = "🛡️ <b>Admin Message:</b>";

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

  // A. Specific Chat
  if (u1 && u2) {
    const msgs = await Message.find({
      $or: [
        { sender_id: u1, receiver_id: u2 },
        { sender_id: u2, receiver_id: u1 }
      ]
    }).sort({ timestamp: 1 });

    const partner = await User.findOne({ tg_id: u2 }).select('last_seen first_name tg_id is_verified is_admin');
    
    // Partner Data Check
    const pData = partner ? partner.toObject() : {};
    // Owner Check manually add karo safety ke liye
    if (pData.tg_id === OWNER_ID) {
      pData.is_admin = true; 
      pData.is_owner = true;
    }

    return res.json({ messages: msgs, partner: pData });
  }

  // B. Recent Chat List (SORTING LOGIC HERE)
  if (type === 'list' && myId) {
    const uid = Number(myId);
    
    const msgs = await Message.find({
      $or: [{ sender_id: uid }, { receiver_id: uid }]
    }).sort({ timestamp: -1 }).limit(200);

    const partnerIds = new Set();
    msgs.forEach(m => partnerIds.add(m.sender_id === uid ? m.receiver_id : m.sender_id));

    const partners = Array.from(partnerIds);
    let users = await User.find({ tg_id: { $in: partners } }).lean();

    // 1. Unread Count Add karo
    for (let user of users) {
      user.unread_count = await Message.countDocuments({
        sender_id: user.tg_id, receiver_id: uid, is_read: false
      });
      // Owner tag manually lagao
      if (user.tg_id === OWNER_ID) user.is_owner = true;
    }

    // 2. SORTING: Unread wale sabse upar, fir baaki
    users.sort((a, b) => b.unread_count - a.unread_count);

    return res.json(users);
  }

  res.json([]);
};
