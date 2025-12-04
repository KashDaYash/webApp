// Command: profile.js
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- SETUP ---
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
applyTheme(currentTheme);

// --- TELEGRAM DATA CHECK ---
// Real Telegram Data
const u = tg.initDataUnsafe?.user;

let currentChatId = null;
let chatPoll = null;

// --- INIT LOGIC ---
window.onload = () => {
  const loader = document.getElementById("loadingScreen");
  const gate = document.getElementById("loginGate");
  const app = document.getElementById("app");
  const nav = document.getElementById("bottomNav");

  // 1. CHECK: ARE WE IN TELEGRAM?
  // Agar u (user) undefined hai, matlab browser me hain
  if (!u || !u.id) {
    if(loader) loader.style.display = "none";
    if(gate) gate.classList.remove("hidden"); // Show Login Gate
    if(app) app.classList.add("hidden"); // Hide App
    return; // STOP EXECUTION HERE
  }

  // 2. IF TELEGRAM: SHOW APP
  if(gate) gate.classList.add("hidden");
  if(app) app.classList.remove("hidden");
  if(nav) nav.classList.remove("hidden");

  // 3. Sync User (Sirf tabhi jab asli user ho)
  fetch('/api/syncUser', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(u) 
  })
  .then(res => res.json())
  .then(data => {
      // console.log("Sync Success:", data);
      alert("User Synced: " + u.first_name); // Testing ke liye uncomment karein
  })
  .catch(err => {
      //console.error("Sync Failed:", err);
      alert("Database Error: Check Vercel Logs");
  });


  // 4. Fill UI
  if(document.getElementById("userName")) {
      document.getElementById("userName").textContent = u.first_name;
      document.getElementById("userHandle").textContent = u.username ? "@"+u.username : "—";
      document.getElementById("userId").textContent = u.id;
      document.getElementById("userAvatar").src = u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  }

  setTimeout(() => {
    if(loader) loader.style.display = "none";
  }, 500);

  loadRecentChats();
};

// --- NAVIGATION ---
window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const target = document.getElementById(tabId);
  if(target) target.classList.add('active-page');
  if(navEl) navEl.classList.add('active');
  
  if (tabId === 'tab-chat') {
    const inp = document.getElementById("userSearch");
    if(inp) inp.value = "";
    document.getElementById("suggestionList").innerHTML = "";
    loadRecentChats();
  }
};

// --- THEME ---
window.toggleTheme = () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", currentTheme);
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  const btn = document.querySelector("#themeToggle span");
  if (theme === "light") {
    root.classList.add("light-theme");
    tg.setHeaderColor("#f3f4f6");
    tg.setBackgroundColor("#f3f4f6");
    if(btn) btn.textContent = "light_mode";
  } else {
    root.classList.remove("light-theme");
    tg.setHeaderColor("#0f0f0f");
    tg.setBackgroundColor("#0f0f0f");
    if(btn) btn.textContent = "dark_mode";
  }
}

// --- SEARCH ---
const searchInput = document.getElementById("userSearch");
let searchTimer;

if(searchInput) {
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      const rec = document.getElementById("recentChatsList");
      const sug = document.getElementById("suggestionList");
      
      if (!val) {
        sug.innerHTML = "";
        if(rec) rec.classList.remove("hidden");
        return;
      }
      
      if(rec) rec.classList.add("hidden");
      
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => performSearch(val), 300);
    });
}

async function performSearch(query) {
  const sug = document.getElementById("suggestionList");
  sug.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.6;">Searching...</div>`;

  try {
    // Check u.id exists before searching
    if(!u || !u.id) return;

    const res = await fetch(`/api/search?query=${query}&myId=${u.id}`);
    const rawData = await res.json();
    
    // FAIL-SAFE: Filter out self
    const data = rawData.filter(user => Number(user.tg_id) !== Number(u.id));

    if (data.length === 0) {
      sug.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.5;">No users found</div>`;
      return;
    }

    sug.innerHTML = data.map(usr => `
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
    sug.innerHTML = "Error";
  }
}

// --- RECENT CHATS ---
async function loadRecentChats() {
  const list = document.getElementById("recentChatsList");
  const empty = document.getElementById("emptyChatState");
  
  if(!list || !u || !u.id) return;

  try {
    const res = await fetch(`/api/chat?type=list&myId=${u.id}`);
    const users = await res.json();
    
    list.innerHTML = ""; 
    
    if (!users || users.length === 0) {
      if(empty) empty.classList.remove("hidden");
      return;
    }

    if(empty) empty.classList.add("hidden");
    list.classList.remove("hidden");

    list.innerHTML = users.map(usr => `
      <div class="user-item" onclick="openChatRoom(${usr.tg_id}, '${usr.first_name}', '${usr.photo_url}')">
        <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div style="flex:1">
           <div style="font-weight:600;">${usr.first_name}</div>
           <div style="font-size:0.8rem; opacity:0.6;">Tap to chat</div>
        </div>
      </div>
    `).join('');
  } catch (e) {}
}

// --- CHAT ROOM ---
window.openChatRoom = (id, name, photo) => {
  currentChatId = Number(id);
  
  document.getElementById("chatPartnerName").textContent = name;
  document.getElementById("chatPartnerImg").src = photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  const overlay = document.getElementById("chatRoom");
  overlay.classList.add("open");
  
  tg.BackButton.show();
  tg.BackButton.onClick(closeChatRoom);
  
  loadMessages();
  if(chatPoll) clearInterval(chatPoll);
  chatPoll = setInterval(loadMessages, 3000);
};

window.closeChatRoom = () => {
  document.getElementById("chatRoom").classList.remove("open");
  tg.BackButton.hide();
  clearInterval(chatPoll);
  currentChatId = null;
  loadRecentChats();
};

async function loadMessages() {
  if (!currentChatId || !u || !u.id) return;
  try {
    const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatId}`);
    const msgs = await res.json();
    const box = document.getElementById("messageArea");
    
    const isAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 150;
    
    box.innerHTML = msgs.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      return `
        <div class="msg ${m.sender_id == u.id ? 'out' : 'in'}">
          ${m.text} <span class="msg-time">${time}</span>
        </div>`;
    }).join('');
    
    if(isAtBottom || msgs.length < 5) box.scrollTop = box.scrollHeight;
  } catch(e) {}
}

// --- SEND MESSAGE ---
window.sendMsg = async () => {
  const inp = document.getElementById("msgInput");
  const txt = inp.value.trim();
  
  if(!currentChatId || !txt || !u || !u.id) return;
  
  inp.value = "";
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
  } catch(e) {
    alert("Failed to send.");
  }
};
