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
