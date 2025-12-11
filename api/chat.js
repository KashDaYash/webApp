const connectDB = require('./lib/db');
const { Message, User } = require('./lib/models');
const BOT_TOKEN = process.env.BOT_TOKEN;

module.exports = async (req, res) => {
  await connectDB();

  // --- 1. SEND MESSAGE ---
  if (req.method === 'POST') {
    const { sender_id, receiver_id, text } = req.body;
    const msg = await Message.create({ 
      sender_id, 
      receiver_id, 
      text,
      is_read: false // Default unread
    });

    // Notify Telegram Bot
    if (BOT_TOKEN) {
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: receiver_id, text: `📩 New Message:\n${text}` })
        });
      } catch (e) {}
    }
    return res.json(msg);
  }

  // --- 2. MARK AS READ (New Feature) ---
  if (req.method === 'PUT') {
    const { myId, partnerId } = req.body;
    // Mere partner ne jo mujhe bheje hain, unhe 'read' kar do
    await Message.updateMany(
      { sender_id: partnerId, receiver_id: myId, is_read: false },
      { $set: { is_read: true } }
    );
    return res.json({ success: true });
  }

  // --- 3. GET DATA ---
  const { u1, u2, type, myId } = req.query;

  // A. Get Conversation History
  if (u1 && u2) {
    const msgs = await Message.find({
      $or: [
        { sender_id: u1, receiver_id: u2 },
        { sender_id: u2, receiver_id: u1 }
      ]
    }).sort({ timestamp: 1 });
    return res.json(msgs);
  }

  // B. Get Recent Chat List with UNREAD COUNTS
  if (type === 'list' && myId) {
    const uid = Number(myId);
    
    // Find messages where I am involved
    const msgs = await Message.find({
      $or: [{ sender_id: uid }, { receiver_id: uid }]
    }).sort({ timestamp: -1 }).limit(200);

    const partnerIds = new Set();
    msgs.forEach(m => {
      partnersIds.add(m.sender_id === uid ? m.receiver_id : m.sender_id);
    });

    const partners = Array.from(partnerIds);
    const users = await User.find({ tg_id: { $in: partners } }).lean();

    // Har user ke liye unread count nikalo
    for (let user of users) {
      const count = await Message.countDocuments({
        sender_id: user.tg_id,
        receiver_id: uid,
        is_read: false
      });
      user.unread_count = count; // Frontend ko bhejo
    }

    return res.json(users);
  }

  res.json([]);
};
