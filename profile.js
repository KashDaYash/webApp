const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- CONFIGURATION ---
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
applyTheme(currentTheme);

// --- USER DATA ---
const u = tg.initDataUnsafe?.user;
let currentChatId = null;
let chatPoll = null;

// --- INITIALIZATION ---
window.onload = () => {
  const gate = document.getElementById("loginGate");
  const app = document.getElementById("app");
  const nav = document.getElementById("bottomNav");
  const loader = document.getElementById("loadingScreen");

  // 1. Check: Are we in Telegram?
  if (!u || !u.id) {
    if(loader) loader.style.display = "none";
    if(gate) gate.classList.remove("hidden");
    if(app) app.classList.add("hidden");
    return;
  }

  // 2. Show App
  if(gate) gate.classList.add("hidden");
  if(app) app.classList.remove("hidden");
  if(nav) nav.classList.remove("hidden");

  // 3. Sync User to DB
  fetch('/api/syncUser', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(u) 
  }).catch(console.error);

  // 4. Update Profile UI
  if(document.getElementById("userName")) {
      document.getElementById("userName").textContent = u.first_name;
      document.getElementById("userHandle").textContent = u.username ? "@"+u.username : "—";
      document.getElementById("userId").textContent = u.id;
      if(u.photo_url) document.getElementById("userAvatar").src = u.photo_url;
  }

  setTimeout(() => { if(loader) loader.style.display = "none"; }, 500);

  // 5. Load Chats
  loadRecentChats();
};

// --- NAVIGATION ---
window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const target = document.getElementById(tabId);
  if(target) target.classList.add('active-page');
  if(navEl) navEl.classList.add('active');

  if(tabId === 'tab-chat') {
    // Reset Search
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
};

function applyTheme(t) {
  const btn = document.querySelector(".theme-btn-float span");
  if(t === 'light') {
    root.classList.add('light-theme');
    tg.setHeaderColor('#f3f4f6'); tg.setBackgroundColor('#f3f4f6');
    if(btn) btn.textContent = "light_mode";
  } else {
    root.classList.remove('light-theme');
    tg.setHeaderColor('#0f0f0f'); tg.setBackgroundColor('#0f0f0f');
    if(btn) btn.textContent = "dark_mode";
  }
}

// --- SEARCH SYSTEM ---
const sInput = document.getElementById("userSearch");
let sTimer;

if(sInput) {
  sInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    const rec = document.getElementById("recentChatsList");
    const sug = document.getElementById("suggestionList");

    if(!val) {
      sug.innerHTML = "";
      if(rec) rec.classList.remove("hidden");
      return;
    }
    if(rec) rec.classList.add("hidden");
    
    clearTimeout(sTimer);
    sTimer = setTimeout(() => doSearch(val), 300);
  });
}

async function doSearch(query) {
  const sug = document.getElementById("suggestionList");
  sug.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.6">Searching...</div>`;
  
  try {
    const res = await fetch(`/api/search?query=${query}&myId=${u.id}`);
    const rawData = await res.json();
    
    // Filter self out
    const data = rawData.filter(user => Number(user.tg_id) !== Number(u.id));

    if(data.length === 0) {
      sug.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.5">No users found</div>`;
      return;
    }

    // FIX: Using data attributes instead of function arguments
    sug.innerHTML = data.map(usr => `
      <div class="user-item" 
           onclick="openChat(this)" 
           data-id="${usr.tg_id}" 
           data-name="${usr.first_name}" 
           data-photo="${usr.photo_url || ''}">
        <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div style="flex:1">
           <div style="font-weight:600">${usr.first_name}</div>
           <div style="font-size:0.8rem; opacity:0.7">@${usr.username || 'unknown'}</div>
        </div>
        <span class="material-icons-round" style="color:var(--accent)">chat</span>
      </div>
    `).join('');
  } catch(e) { sug.innerHTML = "Error searching"; }
}

// --- RECENT CHATS ---
async function loadRecentChats() {
  const list = document.getElementById("recentChatsList");
  const empty = document.getElementById("emptyChatState");
  if(!list) return;

  try {
    const res = await fetch(`/api/chat?type=list&myId=${u.id}`);
    const users = await res.json();
    
    list.innerHTML = "";
    if(!users || users.length === 0) {
      if(empty) empty.classList.remove("hidden");
      return;
    }
    if(empty) empty.classList.add("hidden");
    list.classList.remove("hidden");

    // FIX: Using data attributes here too
    list.innerHTML = users.map(usr => `
      <div class="user-item" 
           onclick="openChat(this)" 
           data-id="${usr.tg_id}" 
           data-name="${usr.first_name}" 
           data-photo="${usr.photo_url || ''}">
        <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div style="flex:1">
           <div style="font-weight:600">${usr.first_name}</div>
           <div style="font-size:0.8rem; opacity:0.6">Tap to chat</div>
        </div>
      </div>
    `).join('');
  } catch(e){}
}

// --- CHAT LOGIC (THE FIX) ---
// Ab ye function 'element' lega, parameters nahi
window.openChat = (el) => {
  // Read data from the clicked element
  const id = el.getAttribute("data-id");
  const name = el.getAttribute("data-name");
  const photo = el.getAttribute("data-photo");

  if(!id) return;

  currentChatId = Number(id);
  
  // Update UI
  document.getElementById("chatPartnerName").textContent = name;
  document.getElementById("chatPartnerImg").src = photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  // Show Overlay
  const overlay = document.getElementById("chatRoom");
  overlay.classList.add("open");
  
  // Handle Back Button
  tg.BackButton.show();
  tg.BackButton.onClick(closeChat);

  // Load Messages
  loadMsgs();
  if(chatPoll) clearInterval(chatPoll);
  chatPoll = setInterval(loadMsgs, 3000);
};

window.closeChat = () => {
  document.getElementById("chatRoom").classList.remove("open");
  tg.BackButton.hide();
  clearInterval(chatPoll);
  currentChatId = null;
  loadRecentChats(); // Refresh list to update latest msg order
};

async function loadMsgs() {
  if(!currentChatId) return;
  try {
    const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatId}`);
    const msgs = await res.json();
    const box = document.getElementById("messageArea");
    
    // Auto Scroll logic
    const isBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 150;
    
    box.innerHTML = msgs.map(m => {
      const t = new Date(m.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      return `<div class="msg ${m.sender_id == u.id ? 'out' : 'in'}">${m.text}<span class="msg-time">${t}</span></div>`;
    }).join('');

    if(isBottom || msgs.length < 5) box.scrollTop = box.scrollHeight;
  } catch(e){}
}

// --- SEND MESSAGE ---
window.sendMsg = async () => {
  const inp = document.getElementById("msgInput");
  const txt = inp.value.trim();
  if(!txt || !currentChatId) return;

  inp.value = "";
  const box = document.getElementById("messageArea");
  const t = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  
  // Optimistic UI
  box.innerHTML += `<div class="msg out" style="opacity:0.7">${txt}<span class="msg-time">${t}</span></div>`;
  box.scrollTop = box.scrollHeight;

  await fetch('/api/chat', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({sender_id: u.id, receiver_id: currentChatId, text: txt})
  });
  loadMsgs();
};
