const connectDB = require('./lib/db');
const { User, Item } = require('./lib/models');

module.exports = async (req, res) => {
  await connectDB();
  
  if (req.method === 'GET') {
    // Return all items grouped or flat
    const items = await Item.find({});
    return res.json(items);
  }

  if (req.method === 'POST') {
    const { action, telegramId, itemId } = req.body;
    
    if (action === 'buy') {
      const user = await User.findOne({ telegramId });
      const item = await Item.findById(itemId);
      
      if (!item) return res.status(404).json({ error: "Item not found" });
      if (user.coins < item.price) return res.status(400).json({ error: "Not enough coins" });
      
      user.coins -= item.price;
      user.inventory.push({ 
        name: item.name, 
        category: item.category, 
        power: item.power, 
        description: item.description 
      });
      
      // Apply immediate effects if potion/fruit
      if (['Fruits', 'Potions'].includes(item.category)) {
        user.hp = Math.min(user.max_hp, user.hp + item.power);
      } else if (item.category === 'Weapons') {
        user.attack += item.power;
      } else if (item.category === 'Armor') {
        user.defense += item.power;
      }

      await user.save();
      return res.json({ success: true, coins: user.coins, inventory: user.inventory });
    }
  }
};
