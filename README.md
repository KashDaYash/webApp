# ⚔️ Telegram RPG BattleBot

A fully functional **Turn-Based RPG Game** inside a Telegram Mini App. Players can fight monsters, level up, buy weapons, and compete on the leaderboard.

Built with **Vanilla JS**, **Node.js (Serverless)**, and **MongoDB**.

## 🎮 Game Features

### 🏟️ Battle Arena (PvE)
* **Monster Hunting:** Fight different monsters (Goblins, Dragons, Titans).
* **Turn-Based Combat:** Attack, Heal, or Flee.
* **Smart UI:** Health bars, floating animations, and damage numbers.
* **Progression:** Earn **Gold** and **XP** to level up.

### 🛒 The Blacksmith (Shop)
* **Buy Gear:** Purchase Swords, Armor, and Potions using in-game Gold.
* **Inventory System:** Items are saved to your profile and boost your stats (Attack/Defense).

### 👤 Hero Profile
* **Live Stats:** Track HP, Energy, Attack Power, and XP.
* **Leveling System:** Auto-level up when XP fills the bar.
* **Bag:** View your collected items.

### 👑 Admin & Owner Panel (Hidden)
* **Control Everything:** Add new Items or Monsters directly from the app.
* **User Management:** Ban hackers, Verify players, or Reset the server.
* **Secure:** Only the `OWNER_ID` can access this panel.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Glassmorphism UI), Vanilla JS.
* **Backend:** Node.js (Vercel Serverless Functions).
* **Database:** MongoDB Atlas (Mongoose).
* **Bot API:** Telegram Web Apps API.

---

## 🚀 Installation & Deployment

### 1. Setup Database
* Create a **MongoDB Atlas** cluster.
* Get your connection string (`MONGO_URI`).

### 2. Configure Code
* Open `api/admin.js`, `api/battle.js`, and `profile.js`.
* Replace `const OWNER_ID = 1302298741;` with **YOUR Telegram ID**.
* (Optional) Update `MONSTERS` list in `api/battle.js` with your own images.

### 3. Deploy to Vercel
1.  Upload code to **GitHub**.
2.  Import to **Vercel**.
3.  Set Environment Variables:
    * `MONGO_URI`: Your Database URL.
    * `BOT_TOKEN`: Your Telegram Bot Token.
4.  **Deploy!** 🚀

---

## 📂 Project Structure


├── api/
│   ├── lib/
│   │   ├── db.js         # DB Connection
│   │   └── models.js     # User, Monster, Item Schema
│   ├── admin.js          # Owner Controls (Add Item/Monster)
│   ├── battle.js         # Fight Logic & Calculations
│   ├── shop.js           # Buying & Inventory Logic
│   ├── search.js         # Leaderboard & Discover API
│   └── syncUser.js       # Login & Stat Initialization
├── profile.html          # Main Game UI
├── profile.css           # RPG Theme & Animations
├── profile.js            # Game Engine & Logic
└── README.md             # Game Guide

---

## 🔮 Future Roadmap
* **PvP Arena:** Real-time battles between players.
* **Boss Raids:** Multiplayer cooperative fights.
* **Trading:** Allow players to trade items.

---

## ❤️ Credits
Developed for the Telegram Mini App Ecosystem.
