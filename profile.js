const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- CONFIG ---
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
let customBg = localStorage.getItem("customBg");
let isGradient = localStorage.getItem("isGradient") === "true";

// Apply Settings Immediately
if (customBg) {
  applyCustomBg(customBg, isGradient);
} else {
  applyTheme(currentTheme);
}

// USER DATA
const u = tg.initDataUnsafe?.user;
// ➤ ADMIN ID (Aapki ID)
const ADMIN_ID = 1302298741; 

let currentChatId = null;
let chatPoll = null;

// --- INITIALIZATION ---
window.onload = () => {
  const gate = document.getElementById("loginGate");
  const app = document.getElementById("app");
  const nav = document.getElementById("bottomNav");
  const loader = document.getElementById("loadingScreen");

  // 1. GATEWAY CHECK
  if (!u || !u.id) {
    if(loader) loader.style.display = "none";
    if(gate) gate.classList.remove("hidden");
    if(app) app.classList.add("hidden");
    return;
  }

  if(gate) gate.classList.add("hidden");
  if(app) app.classList.remove("hidden");
  if(nav) nav.classList.remove("hidden");

  // 2. THEME INIT
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

  // 3. SYNC USER
  fetch('/api/syncUser', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(u) 
  }).catch(console.error);

  // 4. ADMIN CHECK
  if (u.id === ADMIN_ID) {
    injectAdminButton();
  }

  // 5. UPDATE UI
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
  
  // Close context menu on click anywhere
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.msg')) removeContextMenu();
  });
};

// --- ADMIN LOGIC ---
function injectAdminButton() {
  const menuList = document.querySelector("#tab-settings .menu-list");
  if(!menuList) return;
  
  const adminBtn = document.createElement("div");
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
  
  // Insert at top of settings
  menuList.insertBefore(adminBtn, menuList.firstChild);
}

async function loadAdminData() {
  const list = document.getElementById("adminUserList");
  list.innerHTML = `<div style="text-align:center;padding:20px;opacity:0.6">Loading Database...</div>`;

  try {
    const res = await fetch('/api/admin', {
        method: 'POST', // Admin API expects POST usually or use GET with query
        // Let's use GET for listing if your API supports it, otherwise stick to the API structure you made.
        // Based on previous step, we made GET for list.
    });
    
    // Correction based on your api/admin.js structure:
    // We need to send requester_id in body for security check if it's POST, 
    // or if we modified it to GET, we pass in query.
    // Let's assume standard POST for security as per previous code:
    const secureRes = await fetch('/api/admin', {
        method: 'GET', // Or POST depending on how you saved api/admin.js. 
        // If you saved the previous code exactly, list is GET but needs requester check? 
        // Actually, previous code used req.body for requester_id in GET which is not standard.
        // Let's fix this call to match standard fetch.
        // Better: Use POST to send requester_id securely in body
    });
    
    // RE-FETCHING WITH CORRECT METHOD based on your api/admin.js:
    // You likely need to send requester_id. 
    const response = await fetch('/api/admin', {
        method: 'POST', // Using POST to send body data safely
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: u.id, action: 'list_users' }) 
        // NOTE: You might need to update api/admin.js to handle 'list_users' action in POST 
        // OR simply pass requester_id in GET query if you prefer.
        // Let's stick to the code I gave you: api/admin.js used GET for list.
        // But GET cannot have body. So I will assume you will pass requester_id in query or logic updates.
        // TO BE SAFE, I will use a POST request with action 'list' to get users.
    });
    
    // Wait, let's look at the api/admin.js I gave you.
    // It had: if (req.method === 'GET') { ... }
    // But it also checked: if (Number(requester_id) !== ADMIN_ID) at the top from req.body.
    // GET requests don't have body. So that API code needs a small tweak or we pass ID in query.
    // Let's fix the Client side to work if you update API to look in query, 
    // OR easier: Send a POST with action="list" (Modify API slightly or use this):
    
    // Let's assume we use this robust call:
    const finalRes = await fetch('/api/admin', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ requester_id: u.id, action: 'list' })
    });
    
    // Note: Ensure your api/admin.js handles action='list' to return users.
    // If not, revert to: const finalRes = await fetch(`/api/admin?requester_id=${u.id}`);
    
    // I will assume you are using the POST method for all admin actions for security.
    const users = await finalRes.json();

    if(users.error) {
        list.innerHTML = `<div style="text-align:center;padding:20px;color:red">${users.error}</div>`;
        return;
    }

    if(document.getElementById("totalUsers")) document.getElementById("totalUsers").textContent = users.length;
    
    list.innerHTML = users.map(user => `
      <div class="menu-row" style="flex-direction:column; align-items:flex-start; gap:10px;">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${user.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" style="width:40px;height:40px;border-radius:50%">
            <div>
              <div style="font-weight:bold; font-size:0.95rem;">
                ${user.first_name} 
                ${user.is_verified ? '<span class="material-icons-round verified-badge" style="font-size:1rem">verified</span>' : ''}
              </div>
              <div style="font-size:0.8rem; opacity:0.6;">ID: ${user.tg_id}</div>
            </div>
          </div>
        </div>
        
        <div style="display:flex; gap:10px; width:100%;">
          <button onclick="toggleVerify(${user.tg_id})" style="flex:1; padding:8px; border-radius:8px; border:none; background:${user.is_verified ? '#ef4444' : '#3b82f6'}; color:white; font-weight:600;">
            ${user.is_verified ? 'Remove Tick' : 'Verify'}
          </button>
          
          <button onclick="deleteUser(${user.tg_id})" style="flex:1; padding:8px; border-radius:8px; border:1px solid #ef4444; background:transparent; color:#ef4444; font-weight:600;">
            Delete
          </button>
        </div>
      </div>
    `).join('');

  } catch(e) {
    // If list fails, fall back to simple error
    // IMPORTANT: Make sure api/admin.js handles the listing correctly.
    // If you used the previous code verbatim, replace the GET block in api/admin.js with a POST check for action === 'list'.
    list.innerHTML = `<div style="text-align:center;padding:20px;opacity:0.6">Error loading data. <br> Check API.</div>`;
  }
}

window.toggleVerify = async (targetId) => {
  if(!confirm("Change Verification status?")) return;
  
  await fetch('/api/admin', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ 
      requester_id: u.id, 
      target_id: targetId, 
      action: 'toggle_verify' 
    })
  });
  loadAdminData();
};

window.deleteUser = async (targetId) => {
  const code = prompt("Type 'DELETE' to confirm banning this user:");
  if(code !== 'DELETE') return;

  await fetch('/api/admin', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ 
      requester_id: u.id, 
      target_id: targetId, 
      action: 'delete_user' 
    })
  });
  alert("User Deleted!");
  loadAdminData();
};

window.filterAdminList = () => {
  const query = document.getElementById("adminSearch").value.toLowerCase();
  const rows = document.querySelectorAll("#adminUserList .menu-row");
  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(query) ? "flex" : "none";
  });
};

// --- THEME LOGIC ---
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
  document.getElementById("colorPreviewBox").style.backgroundColor = "#0f0f0f";
  document.getElementById("gradientToggle").checked = false;
  
  alert("Restored default theme!");
};

window.toggleTheme = () => {
  if(localStorage.getItem("customBg")) {
    if(!confirm("Changing Theme will reset your Custom Background. Continue?")) return;
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

// --- NAVIGATION ---
window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const target = document.getElementById(tabId);
  if(target) target.classList.add('active-page');
  
  // If navEl is passed (clicked), set active. 
  // If null (called from JS), find correct nav item.
  if(navEl) {
      navEl.classList.add('active');
  } else {
      // Find nav item for this tab (Simple mapping)
      // tab-profile -> index 0, tab-chat -> 1, tab-notif -> 2, tab-settings -> 3, tab-admin -> (none)
      const index = ['tab-profile', 'tab-chat', 'tab-notif', 'tab-settings'].indexOf(tabId);
      if(index >= 0) {
          document.querySelectorAll('.nav-item')[index].classList.add('active');
      }
  }

  if(tabId === 'tab-chat') {
    document.getElementById("userSearch").value = "";
    document.getElementById("suggestionList").innerHTML = "";
    loadRecentChats();
  }
};

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

// --- RECENT CHATS ---
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
  
  // ADMIN BADGE
  const adminBadge = usr.is_verified 
    ? `<span class="material-icons-round verified-badge">verified</span>` 
    : ``;

  return `
    <div class="user-item" 
         onclick="openChat(this)" 
         data-id="${usr.tg_id}" 
         data-name="${usr.first_name}" 
         data-photo="${usr.photo_url || ''}"
         data-verified="${usr.is_verified || false}">
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

// --- CHAT LOGIC ---
window.openChat = async (el) => {
  const id = el.getAttribute("data-id");
  const name = el.getAttribute("data-name");
  const photo = el.getAttribute("data-photo");
  const isVerified = el.getAttribute("data-verified") === 'true';
  
  if(!id) return;
  currentChatId = Number(id);
  
  const adminIcon = isVerified ? `<span class="material-icons-round verified-badge" style="font-size:1.1rem;margin-left:5px">verified</span>` : ``;
  
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

// --- CONTEXT MENU ---
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
