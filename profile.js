const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- THEME INIT ---
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
applyTheme(currentTheme);

// --- USER DATA ---
const u = tg.initDataUnsafe?.user || { id: 12345, first_name: "Yash", username: "Demo" };
let currentChatId = null;
let chatPoll = null;

window.onload = () => {
  // UI Fill
  document.getElementById("userName").textContent = [u.first_name, u.last_name].join(" ");
  document.getElementById("userHandle").textContent = u.username ? "@" + u.username : "No Username";
  document.getElementById("userId").textContent = u.id;
  document.getElementById("userAvatar").src = u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  // Hide Loader
  setTimeout(() => document.getElementById("loadingScreen").style.display = "none", 500);
  
  // Sync
  fetch('/api/syncUser', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(u) });
};

// --- NAVIGATION ---
window.switchTab = (tabId, navEl) => {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  // Show selected
  document.getElementById(tabId).classList.add('active-page');
  navEl.classList.add('active');
  tg.HapticFeedback.selectionChanged();
};

// --- THEME ---
document.getElementById("themeToggle").addEventListener("click", toggleTheme);

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", currentTheme);
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  const btnIcon = document.querySelector("#themeToggle span");
  const label = document.getElementById("themeLabel");
  
  if (theme === "light") {
    root.classList.add("light-theme");
    tg.setHeaderColor("#f3f4f6");
    tg.setBackgroundColor("#f3f4f6");
    if(btnIcon) btnIcon.textContent = "light_mode";
    if(label) label.textContent = "Light";
  } else {
    root.classList.remove("light-theme");
    tg.setHeaderColor("#0f0f0f");
    tg.setBackgroundColor("#0f0f0f");
    if(btnIcon) btnIcon.textContent = "dark_mode";
    if(label) label.textContent = "Dark";
  }
}

// --- SEARCH ---
const searchInput = document.getElementById("userSearch");
const suggestions = document.getElementById("suggestionList");
let searchTimer;

searchInput.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  if (!val) { suggestions.innerHTML = ""; return; }
  
  clearTimeout(searchTimer);
  suggestions.innerHTML = `<div style="padding:10px;text-align:center;">Searching...</div>`;
  
  searchTimer = setTimeout(async () => {
    try {
      const res = await fetch(`/api/search?query=${val}`);
      const data = await res.json();
      
      if (!data.length) {
        suggestions.innerHTML = `<div style="padding:10px;text-align:center;">No users found</div>`;
        return;
      }

      suggestions.innerHTML = data.map(usr => `
        <div class="user-item" onclick="openChatRoom(${usr.tg_id}, '${usr.first_name}', '${usr.photo_url}')">
          <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
          <div style="flex:1">
             <div style="font-weight:600">${usr.first_name}</div>
             <div style="font-size:0.8rem; opacity:0.7">@${usr.username}</div>
          </div>
          <span class="material-icons-round" style="color:var(--accent)">chat</span>
        </div>
      `).join('');
    } catch(e) { suggestions.innerHTML = "Error"; }
  }, 400);
});

// --- CHAT ROOM (FIXED) ---
window.openChatRoom = (id, name, photo) => {
  currentChatId = id;
  const overlay = document.getElementById("chatRoom");
  
  // Set Header Info
  document.getElementById("chatPartnerName").textContent = name;
  document.getElementById("chatPartnerImg").src = photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  // Open Overlay
  overlay.classList.add("open");
  tg.BackButton.show();
  tg.BackButton.onClick(closeChatRoom);
  
  loadMessages();
  if(chatPoll) clearInterval(chatPoll);
  chatPoll = setInterval(loadMessages, 3000);
};

window.closeChatRoom = () => {
  const overlay = document.getElementById("chatRoom");
  
  // Close Overlay
  overlay.classList.remove("open");
  
  tg.BackButton.hide();
  clearInterval(chatPoll);
  currentChatId = null;
};

// --- MESSAGES ---
async function loadMessages() {
  if (!currentChatId) return;
  try {
    const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatId}`);
    const msgs = await res.json();
    const box = document.getElementById("messageArea");
    
    // Auto scroll check
    const isAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 100;
    
    box.innerHTML = msgs.map(m => {
      const t = new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      return `
        <div class="msg ${m.sender_id == u.id ? 'out' : 'in'}">
          ${m.text} <span class="msg-time">${t}</span>
        </div>`;
    }).join('');
    
    if(isAtBottom || msgs.length === 1) box.scrollTop = box.scrollHeight;
    
  } catch(e){}
}

document.getElementById("sendBtn").addEventListener("click", sendMsg);

async function sendMsg() {
  const inp = document.getElementById("msgInput");
  const txt = inp.value.trim();
  if(!txt || !currentChatId) return;
  
  inp.value = "";
  const box = document.getElementById("messageArea");
  const t = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  
  box.innerHTML += `<div class="msg out" style="opacity:0.6">${txt} <span class="msg-time">${t}</span></div>`;
  box.scrollTop = box.scrollHeight;
  
  await fetch('/api/chat', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({sender_id: u.id, receiver_id: currentChatId, text: txt})
  });
  loadMessages();
}
