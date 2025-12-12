const connectDB = require('./lib/db');
const { User, Item, Monster } = require('./lib/models'); // Ensure Item/Monster models exist

const OWNER_ID = 1302298741;

module.exports = async (req, res) => {
  await connectDB();
  const { requester_id, action, data } = req.body;

  // Security
  if (Number(requester_id) !== OWNER_ID) {
    return res.status(403).json({ error: "Access Denied" });
  }

  try {
    // --- ADD NEW ITEM ---
    if (action === 'add_item') {
      await Item.create(data); // data = { name: "Sword", price: 100, ... }
      return res.json({ success: true, msg: "Item Added!" });
    }

    // --- ADD MONSTER (DB Based) ---
    // Note: If you use the Hardcoded list in battle.js, this won't affect it unless you switch battle.js to use DB.
    // For now, this stores in DB for future use.
    if (action === 'add_monster') {
      await Monster.create(data);
      return res.json({ success: true, msg: "Monster Added!" });
    }
    
    // --- GIVE GOLD/XP (Cheat Code for Owner) ---
    if (action === 'give_resources') {
        const user = await User.findOne({ tg_id: data.target_id });
        if(user) {
            user.gold += data.amount;
            await user.save();
            return res.json({ success: true });
        }
    }

    res.json({ error: "Unknown Action" });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
