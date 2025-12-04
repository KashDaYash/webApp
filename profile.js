const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- THEME ---
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
applyTheme(currentTheme);

// --- USER ---
const u = tg.initDataUnsafe?.user || { id: 12345, first_name: "Test", last_name: "User", username: "test_user" };
let currentChatId = null;
let chatPoll = null;

window.onload = () => {
  // Sync
  fetch('/api/syncUser', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(u) 
  }).catch(e => console.log(e));

  // UI Fill
  if(document.getElementById("userName")) {
      document.getElementById("userName").textContent = [u.first_name, u.last_name].join(" ");
      document.getElementById("userHandle").textContent = u.username ? "@" + u.username : "No Username";
      document.getElementById("userId").textContent = u.id;
      document.getElementById("userAvatar").src = u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  }
  
  setTimeout(() => {
    const loader = document.getElementById("loadingScreen");
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
    const sInp = document.getElementById("userSearch");
    if(sInp) sInp.value = "";
    if(document.getElementById("suggestionList")) document.getElementById("suggestionList").innerHTML = "";
    loadRecentChats();
  }
};

// --- THEME TOGGLE ---
const themeBtn = document.getElementById("themeToggle");
if(themeBtn) {
    themeBtn.addEventListener("click", () => {
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

// --- SEARCH (FIXED: SELF EXCLUSION) ---
const searchInput = document.getElementById("userSearch");
const suggestions = document.getElementById("suggestionList");
const recentList = document.getElementById("recentChatsList");
let searchTimer;

if(searchInput) {
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      
      if (!val) {
        if(suggestions) suggestions.innerHTML = "";
        if(recentList) recentList.classList.remove("hidden");
        return;
      }
      
      if(recentList) recentList.classList.add("hidden");
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => performSearch(val), 300);
    });
}

async function performSearch(query) {
  try {
    if(!suggestions) return;
    suggestions.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.6;">Searching...</div>`;

    // **CRITICAL FIX**: Passing &myId to exclude self
    const res = await fetch(`/api/search?query=${query}&myId=${u.id}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      suggestions.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.5;">No users found</div>`;
      return;
    }

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
    if(suggestions) suggestions.innerHTML = `<div style="padding:20px;text-align:center;color:red;">Error</div>`;
  }
}

// --- RECENT CHATS ---
async function loadRecentChats() {
  if(!recentList) return;
  try {
    const res = await fetch(`/api/chat?type=list&myId=${u.id}`);
    const users = await res.json();
    
    recentList.innerHTML = ''; 
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
           <div style="font-size:0.8rem; opacity:0.6;">Tap to chat</div>
        </div>
      </div>
    `).join('');
  } catch (e) {}
}

// --- CHAT ROOM ---
window.openChatRoom = (id, name, photo) => {
  currentChatId = Number(id);
  const overlay = document.getElementById("chatRoom");
  
  document.getElementById("chatPartnerName").textContent = name;
  document.getElementById("chatPartnerImg").src = photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
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
  loadRecentChats();
};

async function loadMessages() {
  if (!currentChatId) return;
  try {
    const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatId}`);
    const msgs = await res.json();
    const box = document.getElementById("messageArea");
    if(!box) return;

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
  } catch(e) {}
}
