const connectDB = require('./lib/db');
const { User } = require('./lib/models');

// ➤ FOOD ITEMS (From additems.py)
const ITEMS = [
  { slug: 'apple', name: 'Apple', price: 5, hp: 10, icon: '🍎' },
  { slug: 'banana', name: 'Banana', price: 7, hp: 15, icon: '🍌' },
  { slug: 'grapes', name: 'Grapes', price: 6, hp: 12, icon: '🍇' },
  { slug: 'chocolate', name: 'Chocolate', price: 9, hp: 16, icon: '🍫' },
  { slug: 'watermelon', name: 'Watermelon', price: 10, hp: 20, icon: '🍉' },
  { slug: 'fries', name: 'Fries', price: 12, hp: 22, icon: '🍟' },
  { slug: 'burger', name: 'Burger', price: 15, hp: 25, icon: '🍔' },
  { slug: 'pizza', name: 'Pizza', price: 18, hp: 30, icon: '🍕' },
  { slug: 'cold_drink', name: 'Cold Drink', price: 20, hp: 50, icon: '🥤' }
];

module.exports = async (req, res) => {
  await connectDB();
  const { type, action, userId, itemSlug } = req.method === 'POST' ? req.body : req.query;

  if (type === 'list') return res.json(ITEMS);

  if (action === 'buy') {
    const user = await User.findOne({ tg_id: userId });
    const item = ITEMS.find(i => i.slug === itemSlug);

    if (!item) return res.status(404).json({ error: "Item not found" });
    if (user.coins < item.price) return res.status(400).json({ error: "Not enough coins!" });
    if (user.hp >= user.max_hp) return res.status(400).json({ error: "HP is already full!" });

    // Deduct Coins & Heal
    user.coins -= item.price;
    user.hp = Math.min(user.hp + item.hp, user.max_hp);

    await user.save();
    return res.json({ success: true, hp: user.hp, coins: user.coins, msg: `Ate ${item.name}! +${item.hp} HP` });
  }

  res.json([]);
};
