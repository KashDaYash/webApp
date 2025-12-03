// api/get-chats.js
const { MongoClient } = require('mongodb');

// URI check
const MONGO_URI = process.env.MONGO_URI; 

let cachedClient = null;

async function connectToDatabase() {
    if (!MONGO_URI) throw new Error("MONGO_URI is missing in Env Vars");
    if (cachedClient) return cachedClient;
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    cachedClient = client;
    return client;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        // Database connection test (even if DB is empty)
        // const client = await connectToDatabase(); 
        // const db = client.db('chat_app_db');
        
        // DUMMY DATA RETURN KAR RAHE HAIN ABHI KE LIYE
        const dummyChats = [
            { 
                chat_id: '1', 
                participant_name: 'Telegram Support', 
                last_message: 'Welcome to your new chat app!', 
                time: 'Now', 
                avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png' 
            }
        ];

        res.status(200).json({ success: true, data: dummyChats });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
 
