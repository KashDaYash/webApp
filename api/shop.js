const connectDB = require('./lib/db');
const { User } = require('./lib/models');

const ITEMS = [
  { slug: 'apple', name: 'Apple', price: 5, power: 10, type: 'hp', icon: '🍎' },
  { slug: 'banana', name: 'Banana', price: 7, power: 15, type: 'hp', icon: '🍌' },
  { slug: 'grapes', name: 'Grapes', price: 6, power: 12, type: 'hp', icon: '🍇' },
  { slug: 'chocolate', name: 'Chocolate', price: 9, power: 16, type: 'hp', icon: '🍫' },
  { slug: 'burger', name: 'Burger', price: 15, power: 25, type: 'hp', icon: '🍔' },
  { slug: 'pizza', name: 'Pizza', price: 18, power: 30, type: 'hp', icon: '🍕' },
  { slug: 'sword', name: 'Iron Sword', price: 100, power: 5, type: 'atk', icon: '🗡️' },
  { slug: 'shield', name: 'Wood Shield', price: 150, power: 5, type: 'def', icon: '🛡️' }
];

module.exports = async (req, res) => {
  await connectDB();
  const { action, userId, itemSlug } = req.body;

  if (req.method === 'GET') return res.json(ITEMS);

  if (action === 'buy') {
    const user = await User.findOne({ tg_id: userId });
    const item = ITEMS.find(i => i.slug === itemSlug);

    if (!item) return res.status(404).json({ error: "Item not found" });
    if (user.coins < item.price) return res.status(400).json({ error: "Need more coins!" });

    // Transaction
    user.coins -= item.price;
    
    if (item.type === 'hp') {
        user.hp = Math.min(user.hp + item.power, user.max_hp);
    } else if (item.type === 'atk') {
        user.attack += item.power;
    } else if (item.type === 'def') {
        user.defense += item.power;
    }

    // Add to inventory (Visual only for consumables, permanent for gear)
    if(item.type !== 'hp') {
        user.inventory.push({ slug: item.slug, name: item.name, type: item.type });
    }

    await user.save();
    return res.json({ success: true, coins: user.coins, hp: user.hp, msg: `Bought ${item.name}!` });
  }
};
