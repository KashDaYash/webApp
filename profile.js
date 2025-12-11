const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// CONFIG
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
applyTheme(currentTheme);

// USER
const u = tg.initDataUnsafe?.user;
let currentChatId = null;
let chatPoll = null;

window.onload = () => {
  const gate = document.getElementById("loginGate");
  const app = document.getElementById("app");
  const nav = document.getElementById("bottomNav");
  const loader = document.getElementById("loadingScreen");

  if (!u || !u.id) {
    if(loader) loader.style.display = "none";
    if(gate) gate.classList.remove("hidden");
    if(app) app.classList.add("hidden");
    return;
  }

  if(gate) gate.classList.add("hidden");
  if(app) app.classList.remove("hidden");
  if(nav) nav.classList.remove("hidden");

  fetch('/api/syncUser', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(u) 
  }).catch(console.error);

  if(document.getElementById("userName")) {
      document.getElementById("userName").textContent = u.first_name;
      document.getElementById("userHandle").textContent = u.username ? "@"+u.username : "—";
      document.getElementById("userId").textContent = u.id;
      if(u.photo_url) document.getElementById("userAvatar").src = u.photo_url;
  }

  setTimeout(() => { if(loader) loader.style.display = "none"; }, 500);

  loadRecentChats(); // Initial Load
};

// --- NAVIGATION ---
window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active-page');
  navEl.classList.add('active');

  if(tabId === 'tab-chat') {
    document.getElementById("userSearch").value = "";
    document.getElementById("suggestionList").innerHTML = "";
    loadRecentChats(); // Refresh list to update unread counts
  }
};

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

// --- SEARCH ---
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
    const data = rawData.filter(user => Number(user.tg_id) !== Number(u.id));
    if(data.length === 0) {
      sug.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.5">No users found</div>`;
      return;
    }
    sug.innerHTML = data.map(usr => renderUserItem(usr)).join('');
  } catch(e) { sug.innerHTML = "Error"; }
}

// --- RECENT CHATS (With Badge Logic) ---
async function loadRecentChats() {
  const list = document.getElementById("recentChatsList");
  const empty = document.getElementById("emptyChatState");
  if(!list) return;

  try {
    const res = await fetch(`/api/chat?type=list&myId=${u.id}`);
    const users = await res.json();
    
    // Update Profile Stats
    if(document.getElementById("friendsCount")) {
      document.getElementById("friendsCount").textContent = users.length;
    }

    list.innerHTML = "";
    if(!users.length) {
      if(empty) empty.classList.remove("hidden");
      return;
    }
    if(empty) empty.classList.add("hidden");
    list.classList.remove("hidden");

    list.innerHTML = users.map(usr => renderUserItem(usr, true)).join('');
  } catch(e){}
}

// Helper to render user row
function renderUserItem(usr, showBadge = false) {
  // Badge HTML
  const badgeHtml = (showBadge && usr.unread_count > 0) 
    ? `<div class="unread-badge">${usr.unread_count}</div>` 
    : `<span class="material-icons-round" style="color:var(--accent)">chevron_right</span>`;

  return `
    <div class="user-item" 
         onclick="openChat(this)" 
         data-id="${usr.tg_id}" 
         data-name="${usr.first_name}" 
         data-photo="${usr.photo_url || ''}">
      <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
      <div style="flex:1">
         <div style="font-weight:600">${usr.first_name}</div>
         <div style="font-size:0.8rem; opacity:0.6">
           ${showBadge && usr.unread_count > 0 ? 'New messages' : '@'+(usr.username||'user')}
         </div>
      </div>
      ${badgeHtml}
    </div>
  `;
}

// --- CHAT LOGIC ---
window.openChat = async (el) => {
  const id = el.getAttribute("data-id");
  const name = el.getAttribute("data-name");
  const photo = el.getAttribute("data-photo");
  if(!id) return;

  currentChatId = Number(id);
  
  // Header Update
  document.getElementById("chatPartnerName").textContent = name;
  document.getElementById("chatPartnerImg").src = photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  document.querySelector(".status").textContent = "Connecting..."; // Temp status

  // Mark Read
  fetch('/api/chat', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ myId: u.id, partnerId: currentChatId })
  });

  // Open Overlay
  const overlay = document.getElementById("chatRoom");
  overlay.classList.add("open");
  
  tg.BackButton.show();
  tg.BackButton.onClick(closeChat);

  loadMsgs();
  if(chatPoll) clearInterval(chatPoll);
  chatPoll = setInterval(loadMsgs, 3000); // 3 sec polling for Realtime/Online status
};

async function loadMsgs() {
  if(!currentChatId) return;
  try {
    const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatId}`);
    const data = await res.json(); // Ab ye object return karega {messages: [], partner: {}}
    
    const msgs = data.messages || [];
    const partner = data.partner || {};

    // --- ONLINE STATUS LOGIC ---
    const statusEl = document.querySelector(".status");
    if (partner.last_seen) {
      const lastSeen = new Date(partner.last_seen).getTime();
      const now = new Date().getTime();
      const diff = (now - lastSeen) / 1000; // seconds
      
      // Agar 120 seconds (2 min) se kam hai to Online
      if (diff < 120) {
        statusEl.textContent = "🟢 Online";
        statusEl.style.color = "#4ade80"; // Green
      } else {
        // Show Time
        const timeStr = new Date(partner.last_seen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        statusEl.textContent = `Last seen: ${timeStr}`;
        statusEl.style.color = "var(--text-sec)";
      }
    }

    // Render Messages
    const box = document.getElementById("messageArea");
    const isBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 150;
    
    box.innerHTML = msgs.map(m => {
      const t = new Date(m.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      const isMe = m.sender_id == u.id;
      // Double check mark for read
      const checks = isMe ? (m.is_read ? '✓✓' : '✓') : '';
      
      return `
        <div class="msg ${isMe ? 'out' : 'in'}">
          ${m.text}
          <span class="msg-time">
            ${t} <span style="margin-left:3px">${checks}</span>
          </span>
        </div>`;
    }).join('');

    if(isBottom || msgs.length < 5) box.scrollTop = box.scrollHeight;
  } catch(e){ console.error(e); }
}


window.sendMsg = async () => {
  const inp = document.getElementById("msgInput");
  const txt = inp.value.trim();
  if(!txt || !currentChatId) return;

  inp.value = "";
  const box = document.getElementById("messageArea");
  const t = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  
  box.innerHTML += `<div class="msg out" style="opacity:0.7">${txt}<span class="msg-time">${t}</span></div>`;
  box.scrollTop = box.scrollHeight;

  await fetch('/api/chat', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({sender_id: u.id, receiver_id: currentChatId, text: txt})
  });
  loadMsgs();
};
