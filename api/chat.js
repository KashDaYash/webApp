const connectDB = require('./lib/db');
const { Message, User } = require('./lib/models');
const BOT_TOKEN = process.env.BOT_TOKEN;

module.exports = async (req, res) => {
  await connectDB();

  // --- 1. HANDLE TYPING STATUS ---
  // Jab user type karega, frontend yahan request bhejega
  if (req.method === 'PATCH') {
    const { userId } = req.body;
    await User.updateOne({ tg_id: userId }, { last_typed: new Date() });
    return res.json({ success: true });
  }

  // --- 2. DELETE MESSAGE (Feature 4) ---
  if (req.method === 'DELETE') {
    const { msgId, senderId } = req.body;
    // Sirf wahi delete kar sake jisne bheja hai
    const result = await Message.deleteOne({ _id: msgId, sender_id: senderId });
    return res.json({ success: result.deletedCount > 0 });
  }

  // --- 3. SEND MESSAGE ---
  if (req.method === 'POST') {
    const { sender_id, receiver_id, text } = req.body;
    
    // Security Check: Empty message na ho
    if(!text || !text.trim()) return res.status(400).json({error: "Empty message"});

    const msg = await Message.create({ 
      sender_id, receiver_id, text, is_read: false 
    });

    // Notify Bot
    if (BOT_TOKEN) {
      try {
        const sender = await User.findOne({ tg_id: sender_id });
        const name = sender ? sender.first_name : "Someone";
        const notifText = `📩 <b>${name}</b>: ${text}`;
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: receiver_id, text: notifText, parse_mode: 'HTML' })
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

  // A. SPECIFIC CHAT (With Typing Status)
  if (u1 && u2) {
    const msgs = await Message.find({
      $or: [
        { sender_id: u1, receiver_id: u2 },
        { sender_id: u2, receiver_id: u1 }
      ]
    }).sort({ timestamp: 1 });

    // Partner Info (Online & Typing Status ke liye)
    const partner = await User.findOne({ tg_id: u2 }).select('last_seen last_typed first_name tg_id');
    
    return res.json({ messages: msgs, partner: partner });
  }

  // B. RECENT CHAT LIST
  if (type === 'list' && myId) {
    const uid = Number(myId);
    const msgs = await Message.find({
      $or: [{ sender_id: uid }, { receiver_id: uid }]
    }).sort({ timestamp: -1 }).limit(200);

    const partnerIds = new Set();
    msgs.forEach(m => {
      partnerIds.add(m.sender_id === uid ? m.receiver_id : m.sender_id);
    });

    const partners = Array.from(partnerIds);
    const users = await User.find({ tg_id: { $in: partners } }).lean();

    for (let user of users) {
      user.unread_count = await Message.countDocuments({
        sender_id: user.tg_id, receiver_id: uid, is_read: false
      });
    }
    return res.json(users);
  }

  res.json([]);
};
