// api/chat.js
const connectDB = require('./lib/db');
const { Message } = require('./lib/models');

module.exports = async (req, res) => {
  await connectDB();
  
  if (req.method === 'POST') {
    // Send Message
    const { sender_id, receiver_id, text } = req.body;
    const msg = await Message.create({ sender_id, receiver_id, text });
    res.json(msg);
  } else {
    // Get History (Instagram style conversation)
    const { u1, u2 } = req.query;
    const msgs = await Message.find({
      $or: [
        { sender_id: u1, receiver_id: u2 },
        { sender_id: u2, receiver_id: u1 }
      ]
    }).sort({ timestamp: 1 });
    res.json(msgs);
  }
};
