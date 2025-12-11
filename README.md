```markdown
# 🚀 Telegram Chat Web App (Ultimate Edition)

A full-featured **Telegram Mini App** for chatting, social networking, and user management. Built with **Vanilla JS (Frontend)** and **Node.js (Serverless API)**.

## ✨ Features

### 💬 Messaging System
* **Real-time Chat:** Instant messaging with auto-refresh.
* **Sticker Support:** Integrated **Giphy Stickers** inside the chat.
* **Message Actions:** Long-press to **Delete** or **Copy** messages.
* **Unread Count:** Real-time badge on chat list for unread messages.
* **Priority Sorting:** Chats with unread messages appear at the top.

### 🌍 Discover & Social
* **Discover Tab:** Grid view to find all users registered in the app.
* **Pagination:** "Load More" button to load users in batches (10 at a time).
* **Profile Sync:** Automatically syncs Name, Username, and Photo from Telegram.

### 🎨 Customization (Premium UI)
* **Theme Engine:** Toggle between Dark & Light mode.
* **Custom Background:** Choose **ANY color** via Color Picker.
* **Gradient Mode:** Enable cool gradient backgrounds.
* **Instant Apply:** See changes immediately without reloading.

### 👑 Admin & Owner Portal (Hidden)
* **Secure Access:** Only the `OWNER_ID` can access the Admin Panel.
* **User Management:**
    * **Verify User:** Give/Remove Blue Tick (Verified Badge).
    * **Ban User:** Block users from sending messages.
    * **Delete User:** Permanently remove user & chats from DB.
    * **Promote Admin:** Make other users Sub-Admins.
* **Live Stats:** See total user count.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Modern Variables), Vanilla JavaScript.
* **Backend:** Node.js (Vercel Serverless Functions).
* **Database:** MongoDB (Atlas).
* **Integrations:** Telegram Web Apps API, Giphy API.

---

## 🚀 Deployment Guide (Vercel)

### 1. Prerequisite
* A **MongoDB Atlas** Database URL.
* A **Telegram Bot Token** (from @BotFather).
* Your Telegram **User ID** (to set as Owner).

### 2. Setup Code
1.  Clone this repository.
2.  Open `api/chat.js` and `api/admin.js`.
3.  Find the line: `const OWNER_ID = 1302298741;`
4.  **Replace** `1302298741` with **YOUR Telegram ID**.
5.  Do the same in `profile.js` (Frontend).

### 3. Deploy to Vercel
1.  Install Vercel CLI or upload to GitHub.
2.  Import project to Vercel.
3.  **Add Environment Variables** in Vercel Settings:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Connection String |
| `BOT_TOKEN` | `123456:ABC...` | Your Telegram Bot Token |

4.  **Deploy!** 🚀

---

## 📂 Project Structure

```

├── api/
│   ├── lib/
│   │   ├── db.js         \# MongoDB Connection
│   │   └── models.js     \# User & Message Schema
│   ├── admin.js          \# Admin Actions (Ban/Verify/Delete)
│   ├── chat.js           \# Messaging Logic & List
│   ├── search.js         \# Search & Discover Logic
│   └── syncUser.js       \# Sync Telegram User to DB
├── profile.html          \# Main UI Structure
├── profile.css           \# Styling, Themes, Animations
├── profile.js            \# Frontend Logic, API Calls, UI Events
└── README.md             \# Documentation

```

---

## 🛡️ Admin Panel Guide

1.  Open the App in Telegram.
2.  Go to the **Settings** tab.
3.  If your ID matches the `OWNER_ID` in code, you will see a **"Open Admin Portal"** button at the top.
4.  Click it to manage users.

---

## ⚡ API Endpoints

* `POST /api/syncUser` - Create/Update user.
* `GET /api/search` - Search users or fetch Discover grid.
* `GET /api/chat` - Fetch chat history or recent list.
* `POST /api/chat` - Send a text or sticker.
* `DELETE /api/chat` - Delete a message.
* `POST /api/admin` - Perform admin actions (Ban/Verify).

---

## ❤️ Credits
Created for the **Telegram Mini App** Contest/Project.
```
