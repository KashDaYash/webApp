const connectDB = require('./lib/db');
const { Message, User } = require('./lib/models');
const BOT_TOKEN = process.env.BOT_TOKEN;

// ➤ APNI TELEGRAM ID YAHAN DALO (Blue Tick ke liye)
const ADMIN_ID = 1302298741; 

module.exports = async (req, res) => {
  await connectDB();

  // --- 1. DELETE MESSAGE (New Feature) ---
  if (req.method === 'DELETE') {
    const { message_id, user_id } = req.body;
    
    // Sirf wahi delete kar sake jisne bheja hai (Security Check)
    const msg = await Message.findOne({ _id: message_id });
    
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.sender_id !== user_id) return res.status(403).json({ error: "Unauthorized" });

    await Message.deleteOne({ _id: message_id });
    return res.json({ success: true });
  }

  // --- 2. SEND MESSAGE ---
  if (req.method === 'POST') {
    const { sender_id, receiver_id, text } = req.body;
    const msg = await Message.create({ 
      sender_id, receiver_id, text, is_read: false 
    });

    if (BOT_TOKEN) {
      try {
        const sender = await User.findOne({ tg_id: sender_id });
        const name = sender ? sender.first_name : "User";
        // Admin msg alag dikhega
        const alertTitle = sender_id === ADMIN_ID ? "👑 <b>Admin Message:</b>" : `📩 <b>${name}:</b>`;
        
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: receiver_id, 
            text: `${alertTitle}\n\n<i>"${text}"</i>\n\n👇 Open App to reply.`,
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

  // A. Specific Chat (Messages)
  if (u1 && u2) {
    const msgs = await Message.find({
      $or: [
        { sender_id: u1, receiver_id: u2 },
        { sender_id: u2, receiver_id: u1 }
      ]
    }).sort({ timestamp: 1 });

    const partner = await User.findOne({ tg_id: u2 }).select('last_seen first_name tg_id');
    
    // Admin Check
    const partnerData = partner ? partner.toObject() : {};
    if (partnerData.tg_id === ADMIN_ID) partnerData.is_admin = true;

    return res.json({ messages: msgs, partner: partnerData });
  }

  // B. Recent Chat List
  if (type === 'list' && myId) {
    const uid = Number(myId);
    const msgs = await Message.
