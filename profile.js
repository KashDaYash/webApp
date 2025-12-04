// Command: profile.js
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- THEME SETUP ---
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
applyTheme(currentTheme);

// --- USER DATA ---
// Fallback data for testing without Telegram
const u = tg.initDataUnsafe?.user || { id: 12345, first_name: "Test", last_name: "User", username: "test_user" };
let currentChatId = null;
let chatPoll = null;

// --- INITIALIZATION ---
window.onload = () => {
  // 1. Sync User to DB
  fetch('/api/syncUser', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(u) 
  }).catch(err => console.error("Sync Failed", err));

  // 2. Fill UI Data
  if(document.getElementById("userName")) {
      document.getElementById("userName").textContent = [u.first_name, u.last_name].join(" ");
      document.getElementById("userHandle").textContent = u.username ? "@" + u.username : "No Username";
      document.getElementById("userId").textContent = u.id;
      document.getElementById("userAvatar").src = u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  }
  
  // 3. Hide Loader
  setTimeout(() => {
      const loader = document.getElementById("loadingScreen");
      if(loader) loader.style.display = "none";
  }, 500);

  // 4. Load Inbox (Recent Chats)
  loadRecentChats();
};

// --- NAVIGATION LOGIC ---
window.switchTab = (tabId, navEl) => {
  // Remove active class from all
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  // Add active class to target
  const target = document.getElementById(tabId);
  if(target) target.classList.add('active-page');
  if(navEl) navEl.classList.add('active');
  
  // Logic specifically for Chat Tab
  if (tabId === 'tab-chat') {
    // Search clear karo aur list wapas lao
    const searchInp = document.getElementById("userSearch");
    const suggestions = document.getElementById("suggestionList");
    if(searchInp) searchInp.value = "";
    if(suggestions) suggestions.innerHTML = "";
    loadRecentChats();
  }
};

// --- THEME TOGGLE LOGIC ---
const themeToggleBtn = document.getElementById("themeToggle");
if(themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", currentTheme);
      applyTheme(currentTheme);
    });
}

function applyTheme(theme) {
  const btnIcon = document.querySelector("#themeToggle span");
  if (theme === "light") {
    root.classList.add("light-theme");
    tg.setHeaderColor("#f3f4f6");
    tg.setBackgroundColor("#f3f4f6");
    if(btnIcon) btnIcon.textContent = "light_mode";
  } else {
    root.classList.remove("light-theme");
    tg.setHeaderColor("#0f0f0f");
    tg.setBackgroundColor("#0f0f0f");
    if(btnIcon) btnIcon.textContent = "dark_mode";
  }
}

// --- SEARCH SYSTEM (UPDATED) ---
const searchInput = document.getElementById("userSearch");
const suggestions = document.getElementById("suggestionList");
const recentList = document.getElementById("recentChatsList");
let searchTimer;

if(searchInput) {
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      
      // Agar search empty hai -> Recent chats wapas dikhao
      if (!val || val.length === 0) {
        if(suggestions) suggestions.innerHTML = "";
        if(recentList) recentList.classList.remove("hidden");
        return;
      }
      
      // User type kar raha hai -> Recent chupao
      if(recentList) recentList.classList.add("hidden");
      
      // Debounce API call
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => performSearch(val), 300);
    });
}

async function performSearch(query) {
  try {
    if(!suggestions) return;
    suggestions.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.6;">Searching "${query}"...</div>`;

    // **IMPORTANT:** Pass myId to exclude self
    const res = await fetch(`/api/search?query=${query}&myId=${u.id}`);
    
    if (!res.ok) throw new Error("API Error");
    const data = await res.json();

    if (!data || data.length === 0) {
      suggestions.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.5;">No users found</div>`;
      return;
    }

    // Render Search Results
    suggestions.innerHTML = data.map(usr => `
      <div class="user-item" onclick="openChatRoom(${usr.tg_id}, '${usr.first_name}', '${usr.photo_url}')">
        <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div style="flex:1">
           <div style="font-weight:600">${usr.first_name}</div>
           <div style="font-size:0.8rem; opacity:0.7">@${usr.username || 'unknown'}</div>
        </div>
        <span class="material-icons-round" style="color:var(--accent)">chat</span>
      </div>
    `).join('');
    
  } catch (e) {
    console.error(e);
    if(suggestions) suggestions.innerHTML = `<div style="padding:20px;text-align:center;color:red;">Error searching</div>`;
  }
}

// --- RECENT CHATS ---
async function loadRecentChats() {
  if(!recentList) return;
  
  try {
    const res = await fetch(`/api/chat?type=list&myId=${u.id}`);
    const users = await res.json();
    
    recentList.innerHTML = ''; // Clear duplicates
    const emptyState = document.getElementById("emptyChatState");

    if (!users || users.length === 0) {
      if(emptyState) emptyState.classList.remove("hidden");
      return;
    }

    if(emptyState) emptyState.classList.add("hidden");
    recentList.classList.remove("hidden");

    recentList.innerHTML = users.map(usr => `
      <div class="user-item" onclick="openChatRoom(${usr.tg_id}, '${usr.first_name}', '${usr.photo_url}')">
        <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div style="flex:1">
           <div style="font-weight:600;">${usr.first_name}</div>
           <div style="font-size:0.8rem; opacity:0.6;">Tap to open chat</div>
        </div>
      </div>
    `).join('');
    
  } catch (e) { console.error("Recent Load Error", e); }
}

// --- CHAT ROOM LOGIC ---
window.openChatRoom = (id, name, photo) => {
  currentChatId = Number(id); // Ensure ID is Number
  
  const overlay = document.getElementById("chatRoom");
  const nameEl = document.getElementById("chatPartnerName");
  const imgEl = document.getElementById("chatPartnerImg");
  
  if(nameEl) nameEl.textContent = name;
  if(imgEl) imgEl.src = photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  if(overlay) overlay.classList.add("open");
  tg.BackButton.show();
  tg.BackButton.onClick(closeChatRoom);
  
  loadMessages();
  if(chatPoll) clearInterval(chatPoll);
  chatPoll = setInterval(loadMessages, 3000);
};

window.closeChatRoom = () => {
  const overlay = document.getElementById("chatRoom");
  if(overlay) overlay.classList.remove("open");
  
  tg.BackButton.hide();
  clearInterval(chatPoll);
  currentChatId = null;
  loadRecentChats(); // Refresh list on close
};

async function loadMessages() {
  if (!currentChatId) return;
  try {
    const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatId}`);
    const msgs = await res.json();
    const box = document.getElementById("messageArea");
    if(!box) return;

    // Check if user is near bottom to auto-scroll
    const isAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 150;
    
    box.innerHTML = msgs.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      return `
        <div class="msg ${m.sender_id == u.id ? 'out' : 'in'}">
          ${m.text} <span class="msg-time">${time}</span>
        </div>`;
    }).join('');
    
    // Auto scroll logic
    if(isAtBottom || msgs.length < 5) box.scrollTop = box.scrollHeight;
  } catch(e) {}
}

// --- SEND MESSAGE LOGIC ---
const sendBtn = document.getElementById("sendBtn");
const msgInput = document.getElementById("msgInput");

if(sendBtn) sendBtn.addEventListener("click", sendMsg);
if(msgInput) msgInput.addEventListener("keypress", (e) => {
  if(e.key === 'Enter') sendMsg();
});

async function sendMsg() {
  const txt = msgInput.value.trim();
  if(!txt || !currentChatId) return;
  
  msgInput.value = "";
  const box = document.getElementById("messageArea");
  
  const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  box.innerHTML += `<div class="msg out" style="opacity:0.7">${txt} <span class="msg-time">${time}</span></div>`;
  box.scrollTop = box.scrollHeight;
  
  try {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: u.id, receiver_id: currentChatId, text: txt })
    });
    loadMessages();
  } catch(e) { alert("Error sending"); }
}
