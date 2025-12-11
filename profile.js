const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- CONFIG ---
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
let customBg = localStorage.getItem("customBg");
let isGradient = localStorage.getItem("isGradient") === "true";

if (customBg) { applyCustomBg(customBg, isGradient); } 
else { applyTheme(currentTheme); }

// USER DATA
const u = tg.initDataUnsafe?.user;
// ➤ YOUR ADMIN ID
const ADMIN_ID = 1302298741; 

let currentChatId = null;
let chatPoll = null;

// --- INITIALIZATION ---
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

  // Customizer Init
  const bgPicker = document.getElementById("bgPicker");
  const gradCheck = document.getElementById("gradientToggle");
  const colorPreview = document.getElementById("colorPreviewBox");
  if(bgPicker && customBg) {
    bgPicker.value = customBg;
    if(colorPreview) colorPreview.style.backgroundColor = customBg;
  }
  if(gradCheck) gradCheck.checked = isGradient;

  if(bgPicker) {
    bgPicker.addEventListener("input", (e) => {
      const color = e.target.value;
      const isGrad = document.getElementById("gradientToggle").checked;
      if(colorPreview) colorPreview.style.backgroundColor = color;
      applyCustomBg(color, isGrad);
      localStorage.setItem("customBg", color);
    });
  }
  if(gradCheck) {
    gradCheck.addEventListener("change", (e) => {
      const color = document.getElementById("bgPicker").value;
      applyCustomBg(color, e.target.checked);
      localStorage.setItem("isGradient", e.target.checked);
    });
  }

  fetch('/api/syncUser', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(u) 
  }).catch(console.error);

  // Admin Badge on Profile if it's YOU
  let nameHTML = u.first_name;
  if(u.id === ADMIN_ID) {
      nameHTML += ` <span class="material-icons-round verified-badge" style="vertical-align:middle; font-size:1.2rem;">verified</span>`;
  }

  if(document.getElementById("userName")) {
      document.getElementById("userName").innerHTML = nameHTML;
      document.getElementById("userHandle").textContent = u.username ? "@"+u.username : "—";
      document.getElementById("userId").textContent = u.id;
      if(u.photo_url) document.getElementById("userAvatar").src = u.photo_url;
  }

  setTimeout(() => { if(loader) loader.style.display = "none"; }, 500);
  loadRecentChats();
  
  // Close context menu on click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.msg')) removeContextMenu();
  });
};

function applyCustomBg(color, gradient) {
  if (gradient) {
    root.style.background = `linear-gradient(135deg, ${color} 0%, #000000 100%)`;
  } else {
    root.style.background = color;
  }
  root.style.setProperty('--bg', color);
}

window.resetThemeToDefault = () => {
  localStorage.removeItem("customBg");
  localStorage.removeItem("isGradient");
  root.style.background = "";
  applyTheme(currentTheme);
  document.getElementById("bgPicker").value = "#0f0f0f";
  document.getElementById("gradientToggle").checked = false;
  alert("Theme Reset!");
};

window.toggleTheme = () => {
  if(localStorage.getItem("customBg")) {
    if(!confirm("Reset Custom Background?")) return;
    resetThemeToDefault();
    return;
  }
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

window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(tabId).classList.add('active-page');
  navEl.classList.add('active');
  if(tabId === 'tab-chat') {
    document.getElementById("userSearch").value = "";
    document.getElementById("suggestionList").innerHTML = "";
    loadRecentChats();
  }
};

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

async function loadRecentChats() {
  const list = document.getElementById("recentChatsList");
  const empty = document.getElementById("emptyChatState");
  if(!list) return;
  try {
    const res = await fetch(`/api/chat?type=list&myId=${u.id}`);
    const users = await res.json();
    if(document.getElementById("friendsCount")) document.getElementById("friendsCount").textContent = users.length;
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

function renderUserItem(usr, showBadge = false) {
  const badgeHtml = (showBadge && usr.unread_count > 0) 
    ? `<div class="unread-badge">${usr.unread_count}</div>` 
    : `<span class="material-icons-round" style="color:var(--accent)">chevron_right</span>`;
  
  // ADMIN BADGE LOGIC
  const adminBadge = usr.is_admin 
    ? `<span class="material-icons-round verified-badge">verified</span>` 
    : ``;

  return `
    <div class="user-item" 
         onclick="openChat(this)" 
         data-id="${usr.tg_id}" 
         data-name="${usr.first_name}" 
         data-photo="${usr.photo_url || ''}"
         data-admin="${usr.is_admin || false}">
      <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
      <div style="flex:1">
         <div style="font-weight:600">${usr.first_name} ${adminBadge}</div>
         <div style="font-size:0.8rem; opacity:0.6">
           ${showBadge && usr.unread_count > 0 ? 'New messages' : '@'+(usr.username||'user')}
         </div>
      </div>
      ${badgeHtml}
    </div>
  `;
}

window.openChat = async (el) => {
  const id = el.getAttribute("data-id");
  const name = el.getAttribute("data-name");
  const photo = el.getAttribute("data-photo");
  const isAdmin = el.getAttribute("data-admin") === 'true';
  
  if(!id) return;
  currentChatId = Number(id);
  
  // Header with Admin Badge
  const adminIcon = isAdmin ? `<span class="material-icons-round verified-badge" style="font-size:1.1rem;margin-left:5px">verified</span>` : ``;
  
  document.getElementById("chatPartnerName").innerHTML = name + adminIcon;
  document.getElementById("chatPartnerImg").src = photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  document.querySelector(".status").textContent = "Connecting...";

  fetch('/api/chat', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ myId: u.id, partnerId: currentChatId })
  });

  const overlay = document.getElementById("chatRoom");
  overlay.classList.add("open");
  tg.BackButton.show();
  tg.BackButton.onClick(closeChat);

  loadMsgs();
  if(chatPoll) clearInterval(chatPoll);
  chatPoll = setInterval(loadMsgs, 3000);
};

window.closeChat = () => {
  document.getElementById("chatRoom").classList.remove("open");
  tg.BackButton.hide();
  tg.BackButton.offClick(closeChat);
  clearInterval(chatPoll);
  currentChatId = null;
  loadRecentChats();
};

async function loadMsgs() {
  if(!currentChatId) return;
  try {
    const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatId}`);
    const data = await res.json();
    const msgs = data.messages || [];
    const partner = data.partner || {};

    // Online Status Logic
    const statusEl = document.querySelector(".status");
    if (partner.last_seen) {
      const last = new Date(partner.last_seen).getTime();
      const now = new Date().getTime();
      if ((now - last) / 1000 < 120) {
        statusEl.textContent = "🟢 Online";
        statusEl.style.color = "#4ade80";
      } else {
        statusEl.textContent = `Last seen: ${new Date(partner.last_seen).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
        statusEl.style.color = "var(--text-sec)";
      }
    }

    const box = document.getElementById("messageArea");
    // Render only if menu not open
    if(document.querySelector('.context-menu')) return; 

    const isBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 150;
    
    box.innerHTML = msgs.map(m => {
      const t = new Date(m.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      const isMe = m.sender_id == u.id;
      const checks = isMe ? (m.is_read ? '✓✓' : '✓') : '';
      
      // Feature 4: Context Menu on Long Press
      return `
        <div class="msg ${isMe ? 'out' : 'in'}" 
             data-msg-id="${m._id}" 
             oncontextmenu="showContextMenu(event, this, ${isMe})">
          ${m.text}
          <span class="msg-time">${t} <span style="margin-left:3px">${checks}</span></span>
        </div>`;
    }).join('');

    if(isBottom || msgs.length < 5) box.scrollTop = box.scrollHeight;
  } catch(e){}
}

// --- LONG PRESS MENU ---
window.showContextMenu = (e, el, isMe) => {
  e.preventDefault();
  removeContextMenu(); 

  const menu = document.createElement("div");
  menu.className = "context-menu";
  const msgId = el.getAttribute("data-msg-id");
  const text = el.innerText.split("\n")[0]; 

  menu.innerHTML = `
    <div class="ctx-item" onclick="navigator.clipboard.writeText('${text}');removeContextMenu()">
      <span class="material-icons-round">content_copy</span> Copy
    </div>
    ${isMe ? `
    <div class="ctx-item delete" onclick="deleteMessage('${msgId}')">
      <span class="material-icons-round">delete</span> Delete
    </div>` : ''}
  `;

  const rect = el.getBoundingClientRect();
  menu.style.top = `${rect.top + window.scrollY + 10}px`;
  if(isMe) menu.style.right = "20px"; else menu.style.left = "20px";

  document.body.appendChild(menu);
  if(window.navigator.vibrate) window.navigator.vibrate(50);
};

window.removeContextMenu = () => {
  const menus = document.querySelectorAll(".context-menu");
  menus.forEach(m => m.remove());
};

window.deleteMessage = async (msgId) => {
  removeContextMenu();
  if(!confirm("Delete for everyone?")) return;

  const el = document.querySelector(`[data-msg-id="${msgId}"]`);
  if(el) el.style.display = "none"; // Instant hide

  try {
    await fetch('/api/chat', {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ message_id: msgId, user_id: u.id })
    });
  } catch(e) { alert("Delete failed"); }
};

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
