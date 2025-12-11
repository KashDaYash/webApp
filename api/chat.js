const connectDB = require('./lib/db');
const { Message, User } = require('./lib/models');
const BOT_TOKEN = process.env.BOT_TOKEN;

module.exports = async (req, res) => {
  await connectDB();

  // --- 1. SEND MESSAGE ---
  if (req.method === 'POST') {
    const { sender_id, receiver_id, text } = req.body;
    
    // 1. Save Message to DB
    const msg = await Message.create({ 
      sender_id, 
      receiver_id, 
      text,
      is_read: false 
    });

    // 2. Notify Telegram Bot (With Name & Username)
    if (BOT_TOKEN) {
      try {
        // Sender ki details nikalo DB se
        const sender = await User.findOne({ tg_id: sender_id });
        
        // Name aur Username set karo (Fallback ke sath)
        const name = sender ? sender.first_name : "Someone";
        const username = sender && sender.username ? `(@${sender.username})` : "";

        // Notification Message Banao
        const notifText = `📩 New Message from <b>${name}</b> ${username}:\n\n<i>"${text}"</i>\n\n👇 Open App to reply.`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: receiver_id, 
            text: notifText,
            parse_mode: 'HTML' // Taaki Bold/Italic kaam kare
          })
        });
      } catch (e) {
        console.error("Bot Notification Failed:", e);
      }
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

  // A. SPECIFIC CHAT HISTORY
  if (u1 && u2) {
    const msgs = await Message.find({
      $or: [
        { sender_id: u1, receiver_id: u2 },
        { sender_id: u2, receiver_id: u1 }
      ]
    }).sort({ timestamp: 1 });

    const partner = await User.findOne({ tg_id: u2 }).select('last_seen first_name');
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
