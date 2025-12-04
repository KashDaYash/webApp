// api/chat.js
const connectDB = require('./lib/db');
const { Message, User } = require('./lib/models');
// Node ka native fetch use karenge (Node 18+) ya axios
// Vercel environment me 'fetch' usually available hota hai
const BOT_TOKEN = process.env.BOT_TOKEN; 

module.exports = async (req, res) => {
  await connectDB();
  
  // --- 1. SEND MESSAGE & NOTIFY ---
  if (req.method === 'POST') {
    try {
      const { sender_id, receiver_id, text } = req.body;
      
      // Save to MongoDB
      const msg = await Message.create({ sender_id, receiver_id, text });
      
      // Send Telegram Notification to Receiver
      if (BOT_TOKEN && receiver_id) {
        try {
          const teleUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
          await fetch(teleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: receiver_id,
              text: `📩 New Message form WebApp:\n\n"${text}"\n\nOpen app to reply.`
            })
          });
        } catch (teleError) {
          console.error("Telegram Notification Failed:", teleError);
          // Error ignore karein taaki user ka app crash na ho
        }
      }
      
      res.json(msg);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  // --- 2. GET MESSAGES OR CONVERSATION LIST ---
  const { u1, u2, type, myId } = req.query;

  try {
    // CASE A: Specific Chat History (Do logo ke beech ki baat)
    if (u1 && u2) {
      const msgs = await Message.find({
        $or: [
          { sender_id: u1, receiver_id: u2 },
          { sender_id: u2, receiver_id: u1 }
        ]
      }).sort({ timestamp: 1 });
      return res.json(msgs);
    }

    // CASE B: Recent Chat List (Inbox load karna)
    if (type === 'list' && myId) {
      // Find all messages where I am sender OR receiver
      const messages = await Message.find({
        $or: [{ sender_id: myId }, { receiver_id: myId }]
      }).sort({ timestamp: -1 }).limit(100);

      // Unique Users nikalna
      const partnerIds = new Set();
      messages.forEach(m => {
        const pid = m.sender_id == myId ? m.receiver_id : m.sender_id;
        partnerIds.add(pid);
      });

      // Un users ki details lana
      const users = await User.find({ tg_id: { $in: Array.from(partnerIds) } });
      return res.json(users);
    }

    res.json([]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};
