const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Theme Setup
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
applyTheme(currentTheme);

// User Data
const u = tg.initDataUnsafe?.user || { id: 12345, first_name: "Test", last_name: "User", username: "test_user" };
let currentChatId = null;
let chatPoll = null;

// --- INIT ---
window.onload = () => {
  // Sync User to DB
  fetch('/api/syncUser', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(u) 
  });

  // UI Updates
  document.getElementById("userName").textContent = [u.first_name, u.last_name].join(" ");
  document.getElementById("userHandle").textContent = u.username ? "@" + u.username : "No Username";
  document.getElementById("userId").textContent = u.id;
  document.getElementById("userAvatar").src = u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  setTimeout(() => document.getElementById("loadingScreen").style.display = "none", 500);

  // Load Inbox (Recent Chats)
  loadRecentChats();
};

// --- NAVIGATION & THEME ---
window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(tabId).classList.add('active-page');
  navEl.classList.add('active');
  
  // Agar chat tab khola hai to list refresh karo
  if (tabId === 'tab-chat') {
    loadRecentChats();
  }
};

document.getElementById("themeToggle").addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", currentTheme);
  applyTheme(currentTheme);
});

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

// --- RECENT CHATS (INBOX) ---
async function loadRecentChats() {
  const listContainer = document.getElementById("recentChatsList");
  const emptyState = document.getElementById("emptyChatState");
  
  try {
    const res = await fetch(`/api/chat?type=list&myId=${u.id}`);
    const users = await res.json();
    
    // FIX: Clear list to avoid duplicates
    listContainer.innerHTML = ''; 

    if (!users || users.length === 0) {
      listContainer.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    listContainer.classList.remove("hidden");

    listContainer.innerHTML = users.map(usr => `
      <div class="user-item" onclick="openChatRoom(${usr.tg_id}, '${usr.first_name}', '${usr.photo_url}')">
        <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div style="flex:1">
           <div style="font-weight:600;">${usr.first_name}</div>
           <div style="font-size:0.8rem; opacity:0.6;">Tap to chat</div>
        </div>
        <span class="material-icons-round" style="color:var(--accent); font-size:1.2rem;">chevron_right</span>
      </div>
    `).join('');
    
  } catch (e) { console.error("Recent chats error:", e); }
}

// --- SEARCH ---
const searchInput = document.getElementById("userSearch");
const suggestions = document.getElementById("suggestionList");
let searchTimer;

searchInput.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  const recentList = document.getElementById("recentChatsList");
  
  if (!val) {
    suggestions.innerHTML = "";
    recentList.classList.remove("hidden"); // Show inbox back
    return;
  }
  
  recentList.classList.add("hidden"); // Hide inbox while searching
  clearTimeout(searchTimer);
  
  searchTimer = setTimeout(async () => {
    try {
      const res = await fetch(`/api/search?query=${val}`);
      const data = await res.json();
      
      if (!data.length) {
        suggestions.innerHTML = `<div style="padding:15px;text-align:center;color:gray;">No users found</div>`;
        return;
      }

      suggestions.innerHTML = data.map(usr => `
        <div class="user-item" onclick="openChatRoom(${usr.tg_id}, '${usr.first_name}', '${usr.photo_url}')">
          <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
          <div style="flex:1">
             <div style="font-weight:600">${usr.first_name}</div>
             <div style="font-size:0.8rem; opacity:0.7">@${usr.username || 'unknown'}</div>
          </div>
        </div>
      `).join('');
    } catch(e) {}
  }, 400);
});

// --- CHAT ROOM LOGIC ---
window.openChatRoom = (id, name, photo) => {
  // FIX: Ensure ID is number (Search se kabhi string aa sakta hai)
  currentChatId = Number(id);
  
  const overlay = document.getElementById("chatRoom");
  
  document.getElementById("chatPartnerName").textContent = name;
  document.getElementById("chatPartnerImg").src = photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
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
  loadRecentChats(); // Refresh list to update order
};

async function loadMessages() {
  if (!currentChatId) return;
  
  try {
    const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatId}`);
    const msgs = await res.json();
    const box = document.getElementById("messageArea");
    
    // Check if scroll needed
    const isAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 150;
    
    box.innerHTML = msgs.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
      return `
        <div class="msg ${m.sender_id == u.id ? 'out' : 'in'}">
          ${m.text} <span class="msg-time">${time}</span>
        </div>`;
    }).join('');
    
    // Agar naya message aaya hai ya user bottom par tha, to scroll karo
    if(isAtBottom || msgs.length < 5) { 
        box.scrollTop = box.scrollHeight;
    }
    
  } catch(e) {}
}

// Send Message
document.getElementById("sendBtn").addEventListener("click", sendMsg);
document.getElementById("msgInput").addEventListener("keypress", (e) => {
  if(e.key === 'Enter') sendMsg();
});

async function sendMsg() {
  const inp = document.getElementById("msgInput");
  const txt = inp.value.trim();
  if(!txt || !currentChatId) return;
  
  inp.value = "";
  const box = document.getElementById("messageArea");
  
  // Optimistic UI
  const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  box.innerHTML += `<div class="msg out" style="opacity:0.7">${txt} <span class="msg-time">${time} • Sending</span></div>`;
  box.scrollTop = box.scrollHeight;
  
  try {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: u.id, receiver_id: currentChatId, text: txt })
    });
    loadMessages();
  } catch(e) {
    alert("Message failed to send");
  }
}
