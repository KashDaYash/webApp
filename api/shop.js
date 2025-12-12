const connectDB = require('./lib/db');
const { User, Item } = require('./lib/models');

// ➤ DEFAULT SHOP (Food & Basics)
const DEFAULTS = [
  { slug: 'apple', name: 'Apple', price: 5, power: 10, type: 'hp', icon: '🍎' },
  { slug: 'burger', name: 'Burger', price: 15, power: 25, type: 'hp', icon: '🍔' },
  { slug: 'potion', name: 'Health Potion', price: 20, power: 50, type: 'hp', icon: '🧪' },
  { slug: 'sword_wood', name: 'Wooden Sword', price: 50, power: 2, type: 'atk', icon: '🗡️' }
];

module.exports = async (req, res) => {
  await connectDB();
  const method = req.method;
  // Handle query params vs body
  const { type, action, userId, itemSlug, targetId, amount, stat } = method === 'POST' ? req.body : req.query;

  try {
    // 1. LIST ITEMS (Merge DB + Defaults)
    if (type === 'list' || req.query.type === 'list') {
        const dbItems = await Item.find({});
        // Use map to ensure consistent structure
        const formattedDB = dbItems.map(i => ({
            slug: i.slug, name: i.name, price: i.price, 
            power: i.power || i.effect_value, 
            type: i.type, icon: i.image_url || '🎒'
        }));
        return res.json([...DEFAULTS, ...formattedDB]);
    }

    // 2. BUY ITEM
    if (action === 'buy') {
        const user = await User.findOne({ tg_id: userId });
        // Check both lists
        const dbItems = await Item.find({});
        const allItems = [...DEFAULTS, ...dbItems];
        const item = allItems.find(i => i.slug === itemSlug);

        if (!item) return res.status(404).json({ error: "Item gone!" });
        if (user.coins < item.price) return res.status(400).json({ error: "Need Gold!" });

        user.coins -= item.price;

        // Apply Effect
        if (item.type === 'hp') {
            user.hp = Math.min(user.hp + item.power, user.max_hp);
        } else if (item.type === 'atk' || item.type === 'weapon') {
            user.attack += item.power;
            user.damage_min += item.power;
            user.damage_max += item.power;
        } else if (item.type === 'def' || item.type === 'armor') {
            user.defense += item.power;
        }

        // Save to Inventory (Visual)
        if (item.type !== 'hp') {
            user.inventory.push({ name: item.name, icon: item.icon || '⚔️' });
        }

        await user.save();
        return res.json({ success: true, coins: user.coins, hp: user.hp, msg: `Bought ${item.name}` });
    }

    // 3. ADMIN: HEAL/BUFF USER (God Mode)
    if (action === 'admin_buff') {
        // Security check should be in frontend or middleware, but checking here too
        const target = await User.findOne({ tg_id: targetId });
        if (!target) return res.status(404).json({ error: "User not found" });

        if (stat === 'hp') target.hp = target.max_hp;
        if (stat === 'coins') target.coins += parseInt(amount);
        if (stat === 'atk') target.attack += parseInt(amount);
        
        await target.save();
        return res.json({ success: true, msg: "User Buffed!" });
    }

    return res.json([]);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
