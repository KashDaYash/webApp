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
      is_read: false 
    });

    // Telegram Notification
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

  // --- 2. MARK READ ---
  if (req.method === 'PUT') {
    const { myId, partnerId } = req.body;
    await Message.updateMany(
      { sender_id: partnerId, receiver_id: myId, is_read: false },
      { $set: { is_read: true } }
    );
    return res.json({ success: true });
  }

  // --- 3. GET DATA ---
  const { u1, u2, type, myId } = req.query;

  // A. Get Specific Chat & Partner Status (Online Check)
  if (u1 && u2) {
    // Messages fetch karo
    const msgs = await Message.find({
      $or: [
        { sender_id: u1, receiver_id: u2 },
        { sender_id: u2, receiver_id: u1 }
      ]
    }).sort({ timestamp: 1 });

    // Partner ka status check karo (Last Seen)
    const partner = await User.findOne({ tg_id: u2 }).select('last_seen first_name');
    
    return res.json({ messages: msgs, partner: partner });
  }

  // B. Get Recent Chat List (CRASH FIX HERE)
  if (type === 'list' && myId) {
    const uid = Number(myId);
    
    // Find messages involving me
    const msgs = await Message.find({
      $or: [{ sender_id: uid }, { receiver_id: uid }]
    }).sort({ timestamp: -1 }).limit(200);

    const partnerIds = new Set(); // Ye sahi variable name hai
    msgs.forEach(m => {
      // FIX: Pehle yahan spelling mistake thi (partnersIds)
      partnerIds.add(m.sender_id === uid ? m.receiver_id : m.sender_id);
    });

    const partners = Array.from(partnerIds);
    const users = await User.find({ tg_id: { $in: partners } }).lean();

    // Add unread counts
    for (let user of users) {
      const count = await Message.countDocuments({
        sender_id: user.tg_id,
        receiver_id: uid,
        is_read: false
      });
      user.unread_count = count;
    }

    return res.json(users);
  }

  res.json([]);
};
