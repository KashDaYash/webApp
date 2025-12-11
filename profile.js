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

// --- USER ---
const u = tg.initDataUnsafe?.user;
const OWNER_ID = 1302298741; 

let currentChatId = null;
let chatPoll = null;
let discoverPage = 1;
let currentUserData = null;

// --- INIT ---
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

  // Load Theme UI
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

  syncUserAndCheckPermissions();

  if(document.getElementById("userName")) {
      document.getElementById("userName").textContent = u.first_name;
      document.getElementById("userHandle").textContent = u.username ? "@"+u.username : "—";
      document.getElementById("userId").textContent = u.id;
      if(u.photo_url) document.getElementById("userAvatar").src = u.photo_url;
  }

  setTimeout(() => { if(loader) loader.style.display = "none"; }, 500);
  loadRecentChats();
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.msg')) removeContextMenu();
  });
};

async function syncUserAndCheckPermissions() {
  try {
    const res = await fetch('/api/syncUser', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(u) 
    });
    currentUserData = await res.json();

    if (currentUserData.tg_id === OWNER_ID || currentUserData.is_admin) {
      injectAdminButton();
    }
    
    if (currentUserData.is_banned) {
      alert("You are BANNED.");
      Telegram.WebApp.close();
    }

    if (currentUserData.is_verified) {
       document.getElementById("userName").innerHTML += ` <span class="material-icons-round verified-badge" style="vertical-align:middle; font-size:1.2rem;">verified</span>`;
    }
  } catch(e) { console.error(e); }
}

// --- DISCOVER LOGIC ---
window.loadDiscoverUsers = async (reset = false) => {
  const grid = document.getElementById("discoverGrid");
  const btnContainer = document.getElementById("loadMoreContainer");
  
  if(reset) {
    discoverPage = 1;
    grid.innerHTML = "";
    btnContainer.classList.add("hidden");
  }

  try {
    const res = await fetch(`/api/search?query=&page=${discoverPage}&myId=${u.id}`);
    const users = await res.json();

    if (!users || users.length === 0) {
      if(discoverPage === 1) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;opacity:0.5;padding:20px">No users found</div>`;
      btnContainer.classList.add("hidden");
      return;
    }

    const html = users.map(user => `
      <div class="grid-user-card" onclick="openChat(this)"
           data-id="${user.tg_id}" 
           data-name="${user.first_name}" 
           data-photo="${user.photo_url || ''}"
           data-verified="${user.is_verified}">
        <img src="${user.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" loading="lazy">
        <div class="grid-name">
          ${user.first_name} 
          ${user.is_verified ? '<span class="material-icons-round verified-badge" style="font-size:0.8rem">verified</span>' : ''}
        </div>
      </div>
    `).join('');

    grid.insertAdjacentHTML('beforeend', html);

    if (users.length === 10) {
      btnContainer.classList.remove("hidden");
    } else {
      btnContainer.classList.add("hidden");
    }

  } catch(e) { console.error("Discover Error", e); }
};

window.loadMoreUsers = () => {
  discoverPage++;
  loadDiscoverUsers(false);
};

// --- ADMIN LOGIC ---
function injectAdminButton() {
  const menuList = document.querySelector("#tab-settings .menu-list");
  if(!menuList || document.getElementById("adminPortalBtn")) return;

  const adminBtn = document.createElement("div");
  adminBtn.id = "adminPortalBtn";
  adminBtn.className = "menu-row";
  adminBtn.style.border = "1px solid #3b82f6"; 
  adminBtn.style.background = "rgba(59, 130, 246, 0.1)";
  adminBtn.innerHTML = `
    <div class="row-left" style="color:#3b82f6; font-weight:bold;">
      <span class="material-icons-round">admin_panel_settings</span> Open Admin Portal
    </div>
  `;
  adminBtn.onclick = () => {
    loadAdminData(); 
    switchTab('tab-admin', null); 
  };
  menuList.insertBefore(adminBtn, menuList.firstChild);
}

async function loadAdminData() {
  const list = document.getElementById("adminUserList");
  list.innerHTML = `<div style="text-align:center;padding:20px;opacity:0.6">Fetching Database...</div>`;

  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ requester_id: u.id, action: 'list' })
    });
    const users = await res.json();

    if(users.error) {
       list.innerHTML = `<div style="color:red;text-align:center">${users.error}</div>`;
       return;
    }

    if(document.getElementById("totalUsers")) document.getElementById("totalUsers").textContent = users.length;
    const isMeOwner = (u.id === OWNER_ID);

    list.innerHTML = users.map(user => {
      const isTargetOwner = (user.tg_id === OWNER_ID);
      let adminBtn = '';
      if (isMeOwner && !isTargetOwner) {
        adminBtn = `<button onclick="adminAction('toggle_admin', ${user.tg_id})" style="padding:6px;border-radius:6px;border:1px solid var(--accent);background:transparent;color:var(--accent);font-size:0.8rem;margin-left:auto">
          ${user.is_admin ? 'Demote' : 'Make Admin'}
        </button>`;
      }

      return `
      <div class="menu-row" style="flex-direction:column; align-items:flex-start; gap:10px;">
        <div style="display:flex; width:100%; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${user.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" style="width:40px;height:40px;border-radius:50%">
            <div>
              <div style="font-weight:bold; font-size:0.95rem;">
                ${user.first_name} 
                ${user.is_verified ? '<span class="material-icons-round verified-badge" style="font-size:1rem">verified</span>' : ''}
                ${user.is_admin ? '<span style="background:gold;color:black;font-size:0.6rem;padding:2px 4px;border-radius:4px;vertical-align:middle;font-weight:bold">ADMIN</span>' : ''}
                ${user.is_banned ? '<span style="background:red;color:white;font-size:0.6rem;padding:2px 4px;border-radius:4px;vertical-align:middle;font-weight:bold">BANNED</span>' : ''}
              </div>
              <div style="font-size:0.7rem; opacity:0.6;">ID: ${user.tg_id}</div>
            </div>
          </div>
          ${adminBtn}
        </div>
        <div style="display:flex; gap:8px; width:100%;">
          <button onclick="adminAction('toggle_verify', ${user.tg_id})" style="flex:1; padding:8px; border-radius:8px; border:none; background:${user.is_verified ? 'var(--card-bg)' : '#3b82f6'}; color:${user.is_verified ? 'var(--text)' : 'white'}; border:1px solid var(--border)">
            ${user.is_verified ? 'Unverify' : 'Verify'}
          </button>
          <button onclick="adminAction('toggle_ban', ${user.tg_id})" style="flex:1; padding:8px; border-radius:8px; border:none; background:${user.is_banned ? '#4ade80' : '#ef4444'}; color:white;">
            ${user.is_banned ? 'Unban' : 'Ban'}
          </button>
          <button onclick="adminAction('delete_user', ${user.tg_id})" style="padding:8px 12px; border-radius:8px; border:1px solid #ef4444; background:transparent; color:#ef4444;">
            <span class="material-icons-round" style="font-size:1.1rem; vertical-align:middle">delete</span>
          </button>
        </div>
      </div>
    `}).join('');
  } catch(e) { list.innerHTML = "API Error"; }
}

window.adminAction = async (action, targetId) => {
  if (action === 'delete_user' && !confirm("Permanently Delete User?")) return;
  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ requester_id: u.id, target_id: targetId, action: action })
    });
    const data = await res.json();
    if(data.error) alert(data.error);
    else loadAdminData(); 
  } catch(e) { alert("Action Failed"); }
};

window.filterAdminList = () => {
  const query = document.getElementById("adminSearch").value.toLowerCase();
  const rows = document.querySelectorAll("#adminUserList .menu-row");
  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(query) ? "flex" : "none";
  });
};

// --- NAVIGATION & THEME ---
window.resetThemeToDefault = () => {
  localStorage.removeItem("customBg");
  localStorage.removeItem("isGradient");
  root.style.background = "";
  applyTheme(currentTheme);
  document.getElementById("bgPicker").value = "#0f0f0f";
  document.getElementById("gradientToggle").checked = false;
  alert("Theme Reset!");
};

function applyCustomBg(color, gradient) {
  if (gradient) root.style.background = `linear-gradient(135deg, ${color} 0%, #000000 100%)`;
  else root.style.background = color;
  root.style.setProperty('--bg', color);
}

window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(tabId).classList.add('active-page');
  
  if(navEl) navEl.classList.add('active');
  else {
      const map = {'tab-profile':0, 'tab-chat':1, 'tab-discover':2, 'tab-notif':3, 'tab-settings':4};
      if(map[tabId] !== undefined) document.querySelectorAll('.nav-item')[map[tabId]].classList.add('active');
  }

  if(tabId === 'tab-chat') {
    document.getElementById("userSearch").value = "";
    document.getElementById("suggestionList").innerHTML = "";
    loadRecentChats();
  }
  if(tabId === 'tab-discover') {
    loadDiscoverUsers(true);
  }
};

// --- CHAT LOGIC (Send/Receive) ---
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
    const users = await res.json();
    const data = users.filter(user => Number(user.tg_id) !== Number(u.id));
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
  
  const adminBadge = usr.is_verified ? `<span class="material-icons-round verified-badge">verified</span>` : ``;
  const ownerTag = (usr.tg_id === OWNER_ID || usr.is_owner) ? `<span style="background:gold;color:black;font-size:0.6rem;padding:1px 4px;border-radius:4px;margin-left:5px;vertical-align:middle;font-weight:bold">OWNER</span>` : ``;

  return `
    <div class="user-item" 
         onclick="openChat(this)" 
         data-id="${usr.tg_id}" 
         data-name="${usr.first_name}" 
         data-photo="${usr.photo_url || ''}"
         data-verified="${usr.is_verified || false}">
      <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
      <div style="flex:1">
         <div style="font-weight:600">${usr.first_name} ${adminBadge} ${ownerTag}</div>
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
  const isVerified = el.getAttribute("data-verified") === 'true';
  const isOwner = Number(id) === OWNER_ID;
  
  if(!id) return;
  currentChatId = Number(id);
  
  let badges = "";
  if(isVerified) badges += `<span class="material-icons-round verified-badge" style="font-size:1.1rem;margin-left:5px">verified</span>`;
  if(isOwner) badges += `<span style="background:gold;color:black;font-size:0.6rem;padding:1px 4px;border-radius:4px;margin-left:5px;vertical-align:middle;font-weight:bold">OWNER</span>`;

  document.getElementById("chatPartnerName").innerHTML = name + badges;
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
    if(document.querySelector('.context-menu')) return; 

    const isBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 150;
    
    box.innerHTML = msgs.map(m => {
      const t = new Date(m.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
      const isMe = m.sender_id == u.id;
      const checks = isMe ? (m.is_read ? '✓✓' : '✓') : '';
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
    ${isMe || u.id === OWNER_ID ? `
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
  if(!confirm("Delete this message?")) return;
  const el = document.querySelector(`[data-msg-id="${msgId}"]`);
  if(el) el.style.display = "none"; 
  try {
    await fetch('/api/chat', {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ message_id: msgId, user_id: u.id })
    });
  } catch(e) { alert("Failed to delete"); }
};

// ** FINAL SEND FIX **
window.sendMsg = async () => {
  const inp = document.getElementById("msgInput");
  const txt = inp.value.trim();
  
  // Explicit check for chat ID
  if(!txt || !currentChatId) {
      console.log("Cannot send: No text or No Chat ID selected");
      return;
  }

  inp.value = "";
  const box = document.getElementById("messageArea");
  const t = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  box.innerHTML += `<div class="msg out" style="opacity:0.7">${txt}<span class="msg-time">${t}</span></div>`;
  box.scrollTop = box.scrollHeight;

  const res = await fetch('/api/chat', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({sender_id: u.id, receiver_id: currentChatId, text: txt})
  });
  
  if(!res.ok) {
      // If error (like banned), show alert
      const errData = await res.json();
      if(errData.error) alert(errData.error);
  }
  
  loadMsgs();
};
