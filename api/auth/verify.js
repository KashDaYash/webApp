// api/auth/verify.js
const crypto = require('crypto');

const verifyTelegramWebAppData = (telegramInitData) => {
    const token = process.env.BOT_TOKEN;
    if (!token) throw new Error("BOT_TOKEN is missing in Environment Variables");

    const { hash, ...data } = telegramInitData.reduce((acc, part) => {
        const [key, value] = part.split('=');
        acc[key] = value;
        return acc;
    }, {});

    const checkString = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('\n');

    const secret = crypto.createHmac('sha256', 'WebAppData')
        .update(token)
        .digest();

    const calculatedHash = crypto.createHmac('sha256', secret)
        .update(checkString)
        .digest('hex');
    
    return calculatedHash === hash;
};

module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    try {
        const { initData } = req.body;
        if (!initData) {
            return res.status(400).json({ success: false, message: "No initData provided." });
        }

        const dataParts = initData.split('&');
        const isValid = verifyTelegramWebAppData(dataParts);

        if (isValid) {
            const userPart = dataParts.find(s => s.startsWith('user='));
            const userData = JSON.parse(decodeURIComponent(userPart.split('=')[1]));
            
            res.status(200).json({ 
                success: true, 
                message: "Verified",
                user_id: userData.id
            });
        } else {
            res.status(401).json({ success: false, message: "Invalid Hash" });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: e.message });
    }
};
 
