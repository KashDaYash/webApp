# 📱 Telegram Profile & Chat WebApp

A modern, high-performance **Telegram Mini App** featuring a Glassmorphism UI, Real-time Chat, User Search, and Theme Customization. Built with Vanilla JS and Serverless Node.js functions on Vercel.

![Project Banner](https://img.shields.io/badge/Telegram-WebApp-blue?style=for-the-badge&logo=telegram)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

## ✨ Features

- **🎨 Modern UI/UX:** Glassmorphism design with smooth iOS-style transitions.
- **🔐 Telegram Auth Guard:** Automatically detects if opened in a browser and prompts to open in Telegram.
- **👤 User Profile:** Syncs real Telegram user data (Name, Photo, ID, Username) to MongoDB.
- **💬 Real-time Chat:**
  - One-on-one messaging.
  - Chat history persistence (MongoDB).
  - Auto-scroll and "Sending..." status indicators.
- **🔍 Smart Search:**
  - Fuzzy search logic (finds users by name or username).
  - **Self-Exclusion:** You won't see yourself in search results.
- **🌙 Theme System:** Dark/Light mode toggle with local storage persistence.
- **📱 Responsive:** Fully optimized for mobile views within Telegram.

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3 (Variables & Animations), Vanilla JavaScript.
- **Backend:** Node.js (Vercel Serverless Functions).
- **Database:** MongoDB (Mongoose).
- **Deployment:** Vercel.

## 📂 Project Structure

```bash
├── api/                  # Serverless Backend
│   ├── lib/
│   │   ├── db.js         # Database Connection
│   │   └── models.js     # User & Message Schema
│   ├── chat.js           # Chat API (Send/Receive)
│   ├── search.js         # Search API
│   └── syncUser.js       # User Sync/Auth API
├── profile.html          # Main Application File
├── profile.css           # Styling & Animations
├── profile.js            # Frontend Logic (SPA, API calls)
├── vercel.json           # Vercel Configuration
└── README.md             # Documentation

🚀 Getting Started
Prerequisites
 * Node.js installed.
 * A MongoDB Atlas account.
 * A Vercel account.
1. Clone the Repository
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name

2. Install Dependencies
Initialize npm and install Mongoose (required for backend).
npm init -y
npm install mongoose

3. Setup Environment Variables
Create a .env file in the root (for local development) or set these in your Vercel Dashboard.
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
BOT_TOKEN=your_telegram_bot_token

4. Local Development (using Vercel CLI)
To run the serverless functions locally:
npm i -g vercel
vercel dev

📦 Deployment
This project is optimized for Vercel.
 * Push your code to GitHub.
 * Go to Vercel Dashboard and Add New Project.
 * Import your GitHub repository.
 * In the Settings > Environment Variables section, add:
   * MONGO_URI
   * BOT_TOKEN
 * Click Deploy.
🔌 API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/syncUser | Saves or updates Telegram user data in DB. |
| GET | /api/search | Search users (Requires query & myId). |
| GET | /api/chat | Fetch chat history (Requires u1 & u2) or List (type=list). |
| POST | /api/chat | Send a new message. |
🛡 License
This project is open-source and available under the MIT License.
Made with ❤️ for Telegram Mini Apps
