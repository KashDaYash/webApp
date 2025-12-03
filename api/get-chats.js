// api/get-chats.js (Node.js Serverless Function)

const { MongoClient } = require('mongodb');

// Vercel serverless functions mein yeh environment variables access karta hai
const MONGO_URI = process.env.MONGO_URI; 

// Simple in-memory client connection caching (Vercel ke liye achha hai)
let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient;
    }

    const client = new MongoClient(MONGO_URI);
    await client.connect();
    cachedClient = client;
    return client;
}

// NOTE: Production mein, aapko Telegram Auth Verification ko yahan fir se karna hoga
// ya ek separate middleware banana hoga. Hum simple rakhte hain abhi.

module.exports = async (req, res) => {
    // 1. Method check karen
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed. Use GET.' });
    }

    // Front-End se user_id ko query parameter mein aana chahiye: /api/get-chats?user_id=12345
    const userId = req.query.user_id; 

    if (!userId) {
        return res.status(400).json({ success: false, message: 'Missing user_id parameter.' });
    }

    // 2. Database se connect karen
    try {
        const client = await connectToDatabase();
        const db = client.db('chat_app_db'); // Database ka naam badal sakte hain
        const chatsCollection = db.collection('chats');

        // 3. Database se chats fetch karen
        // Production mein: const chats = await chatsCollection.find({ participants: parseInt(userId) }).toArray();
        
        // **DEMO/DUMMY DATA - As database is empty**
        const dummyChats = [
            { 
                chat_id: 'chat_1', 
                participant_name: 'Alexa Bot', 
                participant_handle: 'alexa_dev', 
                last_message: 'Your order is ready to ship!', 
                time: '1h', 
                unread_count: 2, 
                avatar: 'https://cdn-icons-png.flaticon.com/512/1000/1000965.png' 
            },
            { 
                chat_id: 'chat_2', 
                participant_name: 'Bot Support', 
                participant_handle: 'support_bot', 
                last_message: 'How can I help you today?', 
                time: '3d', 
                unread_count: 0, 
                avatar: 'https://cdn-icons-png.flaticon.com/512/3277/3277800.png' 
            }
        ];

        // 4. Success response
        res.status(200).json({ 
            success: true, 
            data: dummyChats 
        });

    } catch (error) {
        console.error('Database/Server Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch chats due to server error.' });
    }
};
