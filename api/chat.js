const connectDB = require('./lib/db');
const { Message, User } = require('./lib/models');
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = 1302298741; // Aapki Admin ID

module.exports = async (req, res) => {
  await connectDB();

  // --- 1. TYPING STATUS UPDATE (New) ---
  if (req.method === 'PATCH') {
    const { user_id } = req.body;
    await User.updateOne({ tg_id: user_id }, { last_typed: new Date() });
    return res.json({ status: 'typing' });
  }

  // --- 2. DELETE MESSAGE ---
  if (req.method === 'DELETE') {
    const { message_id, user_id } = req.body;
    const msg = await Message.findOne({ _id: message_id });
    
    if (!msg) return res.status(404).json({ error: "Not found" });
    // Admin sabka delete kar sakta hai, User sirf apna
    if (msg.sender_id !== user_id && user_id !== ADMIN_ID) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    await Message.deleteOne({ _id: message_id });
    return res.json({ success: true });
  }

  // --- 3. SEND MESSAGE ---
  if (req.method === 'POST') {
    const { sender_id, receiver_id, text } = req.body;
    const msg = await Message.create({ sender_id, receiver_id, text, is_read: false });

    if (BOT_TOKEN) {
      try {
        const sender = await User.findOne({ tg_id: sender_id });
        const name = sender ? sender.first_name : "Someone";
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

  // --- 4. MARK READ ---
  if (req.method === 'PUT') {
    const { myId, partnerId } = req.body;
    await Message.updateMany(
      { sender_id: partnerId, receiver_id: myId, is_read: false },
      { $set: { is_read: true } }
    );
    return res.json({ success: true });
  }

  // --- 5. GET DATA ---
  const { u1, u2, type, myId } = req.query;

  // A. Chat Room Data
  if (u1 && u2) {
    const msgs = await Message.find({
      $or: [{ sender_id: u1, receiver_id: u2 }, { sender_id: u2, receiver_id: u1 }]
    }).sort({ timestamp: 1 });

    const partner = await User.findOne({ tg_id: u2 }).select('last_seen last_typed first_name tg_id is_verified');
    return res.json({ messages: msgs, partner: partner });
  }

  // B. Chat List
  if (type === 'list' && myId) {
    const uid = Number(myId);
    const msgs = await Message.find({
      $or: [{ sender_id: uid }, { receiver_id: uid }]
    }).sort({ timestamp: -1 }).limit(200);

    const partnerIds = new Set();
    msgs.forEach(m => partnerIds.add(m.sender_id === uid ? m.receiver_id : m.sender_id));

    const partners = Array.from(partnerIds);
    let users = await User.find({ tg_id: { $in: partners } }).lean();

    for (let user of users) {
      user.unread_count = await Message.countDocuments({
        sender_id: user.tg_id, receiver_id: uid, is_read: false
      });
    }
    return res.json(users);
  }

  res.json([]);
};
