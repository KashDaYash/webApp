const connectDB = require('./lib/db');
const { User, Item } = require('./lib/models');

// Default Items (Fallback)
const DEFAULT_ITEMS = [
  { slug: 'apple', name: 'Apple', price: 5, power: 10, type: 'hp', icon: '🍎' },
  { slug: 'sword_basic', name: 'Iron Sword', price: 100, power: 5, type: 'atk', icon: '🗡️' },
  { slug: 'potion', name: 'Health Potion', price: 20, power: 50, type: 'hp', icon: '🧪' }
];

module.exports = async (req, res) => {
  await connectDB();
  const { type, action, userId, itemSlug } = req.method === 'POST' ? req.body : req.query;

  try {
    // --- LIST ITEMS (Merge Hardcoded + DB) ---
    if (type === 'list' || req.query.type === 'list') {
      const dbItems = await Item.find({}); // Fetch Admin added items
      // Combine both lists
      const allItems = [...DEFAULT_ITEMS, ...dbItems];
      return res.json(allItems);
    }

    // --- BUY ITEM ---
    if (action === 'buy') {
      const user = await User.findOne({ tg_id: userId });
      
      // Check in both lists
      const dbItems = await Item.find({});
      const allItems = [...DEFAULT_ITEMS, ...dbItems];
      const item = allItems.find(i => i.slug === itemSlug);

      if (!item) return res.status(404).json({ error: "Item not found" });
      if (user.coins < item.price) return res.status(400).json({ error: "Need more coins!" });

      // Transaction
      user.coins -= item.price;
      
      // Apply Stats
      if (item.type === 'hp' || item.type === 'potion') {
          user.hp = Math.min(user.hp + item.power, user.max_hp);
      } else if (item.type === 'atk' || item.type === 'weapon') {
          user.attack += item.power;
          // Permanent boost logic or equip logic can go here
      } else if (item.type === 'def' || item.type === 'armor') {
          user.defense += item.power;
      }

      // Add to Inventory (Skip generic food if you want)
      if(item.type !== 'hp') {
          user.inventory.push({ 
              slug: item.slug, 
              name: item.name, 
              type: item.type, 
              icon: item.icon || '🎒' 
          });
      }

      await user.save();
      return res.json({ 
          success: true, 
          coins: user.coins, 
          hp: user.hp, 
          msg: `Bought ${item.name}!` 
      });
    }
    
    // --- HEAL ---
    if (action === 'heal') {
        const user = await User.findOne({ tg_id: userId });
        if (user.coins >= 10) {
            user.coins -= 10;
            user.hp = Math.min(user.hp + 30, user.max_hp);
            await user.save();
            return res.json({ success: true, hp: user.hp, coins: user.coins });
        }
        return res.json({ success: false, error: "Not enough gold" });
    }

    return res.json([]);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
