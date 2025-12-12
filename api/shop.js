const connectDB = require('./lib/db');
const { User } = require('./lib/models');

// ➤ FIXED SHOP ITEMS
const ITEMS = [
  { slug: 'apple', name: 'Apple', price: 5, power: 10, type: 'hp', icon: '🍎' },
  { slug: 'banana', name: 'Banana', price: 7, power: 15, type: 'hp', icon: '🍌' },
  { slug: 'grapes', name: 'Grapes', price: 6, power: 12, type: 'hp', icon: '🍇' },
  { slug: 'chocolate', name: 'Chocolate', price: 9, power: 16, type: 'hp', icon: '🍫' },
  { slug: 'watermelon', name: 'Watermelon', price: 10, power: 20, type: 'hp', icon: '🍉' },
  { slug: 'fries', name: 'Fries', price: 12, power: 22, type: 'hp', icon: '🍟' },
  { slug: 'burger', name: 'Burger', price: 15, power: 25, type: 'hp', icon: '🍔' },
  { slug: 'pizza', name: 'Pizza', price: 18, power: 30, type: 'hp', icon: '🍕' },
  { slug: 'cold_drink', name: 'Cold Drink', price: 20, power: 50, type: 'hp', icon: '🥤' },
  
  // Weapons
  { slug: 'iron_sword', name: 'Iron Sword', price: 100, power: 5, type: 'atk', icon: '🗡️' },
  { slug: 'wood_shield', name: 'Wood Shield', price: 150, power: 5, type: 'def', icon: '🛡️' }
];

module.exports = async (req, res) => {
  await connectDB();
  
  const method = req.method;
  // Handle query params vs body
  const { type, action, userId, itemSlug } = method === 'POST' ? req.body : req.query;

  try {
    // --- LIST ITEMS (GET or POST) ---
    // Agar type=list hai, toh Items return karo
    if (type === 'list' || req.query.type === 'list') {
      return res.json(ITEMS);
    }

    // --- BUY ITEM ---
    if (action === 'buy') {
      const user = await User.findOne({ tg_id: userId });
      const item = ITEMS.find(i => i.slug === itemSlug);

      if (!item) return res.status(404).json({ error: "Item not found" });
      if (user.coins < item.price) return res.status(400).json({ error: "Need more coins!" });

      // Transaction
      user.coins -= item.price;
      
      // Apply Effect
      if (item.type === 'hp') {
          user.hp = Math.min(user.hp + item.power, user.max_hp);
      } else if (item.type === 'atk') {
          user.attack += item.power;
          user.damage_min += item.power;
          user.damage_max += item.power;
      } else if (item.type === 'def') {
          user.defense += item.power;
      }

      // Add to inventory (Only if NOT food)
      if (item.type !== 'hp') {
          user.inventory.push({ slug: item.slug, name: item.name, type: item.type, icon: item.icon });
      }

      await user.save();
      return res.json({ 
          success: true, 
          coins: user.coins, 
          hp: user.hp, 
          msg: `Bought ${item.name}! Effect: +${item.power}` 
      });
    }
    
    // --- HEAL SHORTCUT ---
    if (action === 'heal') {
        const user = await User.findOne({ tg_id: userId });
        if(user.coins >= 10) {
            user.coins -= 10;
            user.hp = Math.min(user.hp + 20, user.max_hp); // Simple 20HP heal
            await user.save();
            return res.json({ success: true, hp: user.hp, coins: user.coins });
        } else {
            return res.json({ success: false, error: "Not enough gold" });
        }
    }

    return res.json([]);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
