const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Ensure colors match theme immediately
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
applyTheme(currentTheme);

// User Data & State
const u = tg.initDataUnsafe?.user || { id: 12345, first_name: "Yash", username: "yash_demo" };
let currentChatId = null;
let chatPoll = null;

// --- INITIALIZATION ---
window.onload = () => {
  syncUser(); // Save user to DB
  
  // Update UI with User Data
  document.getElementById("userName").textContent = [u.first_name, u.last_name].join(" ");
  document.getElementById("userHandle").textContent = u.username || "No Username";
  document.getElementById("userId").textContent = u.id;
  document.getElementById("userAvatar").src = u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  // Fake Loader
  setTimeout(() => {
    document.getElementById("loadingScreen").style.display = "none";
  }, 800);
  
  // Load Recent Chats (Mock or API)
  loadRecentChats();
};

// --- THEME LOGIC ---
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

// --- TAB NAVIGATION ---
window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active-page');
  navEl.classList.add('active');
  tg.HapticFeedback.selectionChanged();
};

// --- SEARCH & CHAT LOGIC ---
const searchInput = document.getElementById("userSearch");
const suggestions = document.getElementById("suggestionList");
const loader = document.getElementById("searchLoader");
let searchTimer;

searchInput.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  
  // Logic: Agar empty hai toh clear karo, warna search karo
  if (!val) {
    suggestions.innerHTML = "";
    document.getElementById("recentChatsList").classList.remove("hidden"); // Show history back
    return;
  }
  
  document.getElementById("recentChatsList").classList.add("hidden"); // Hide history while searching
  loader.classList.remove("hidden");
  
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => runSearch(val), 400); // 400ms delay debounce
});

async function runSearch(query) {
  try {
    const res = await fetch(`/api/search?query=${query}`);
    const data = await res.json();
    loader.classList.add("hidden");
    
    if (data.length === 0) {
      suggestions.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-sec)">No users found</div>`;
      return;
    }

    suggestions.innerHTML = data.map(usr => `
      <div class="user-item" onclick="openChatRoom(${usr.tg_id}, '${usr.first_name}', '${usr.photo_url}')">
        <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div style="flex:1">
           <div style="font-weight:600;">${usr.first_name}</div>
           <div style="font-size:0.8rem; opacity:0.6;">@${usr.username}</div>
        </div>
        <span class="material-icons-round" style="color:var(--accent)">chat</span>
      </div>
    `).join('');
  } catch(e) { console.error(e); }
}

// --- CHAT ROOM LOGIC ---
window.openChatRoom = (id, name, photo) => {
  currentChatId = id;
  const overlay = document.getElementById("chatRoom");
  
  // Setup Header
  document.getElementById("chatPartnerName").textContent = name;
  document.getElementById("chatPartnerImg").src = photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  // Animation Show
  overlay.style.transform = "translateX(0)";
  tg.BackButton.show();
  tg.BackButton.onClick(closeChatRoom);
  
  loadMessages();
  if(chatPoll) clearInterval(chatPoll);
  chatPoll = setInterval(loadMessages, 3000); // Live Chat Polling
};

window.closeChatRoom = () => {
  document.getElementById("chatRoom").style.transform = "translateX(100%)";
  tg.BackButton.hide();
  clearInterval(chatPoll);
  currentChatId = null;
  loadRecentChats(); // Refresh list when closing chat
};

async function loadMessages() {
  if (!currentChatId) return;
  
  try {
    const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatId}`);
    const msgs = await res.json();
    
    const box = document.getElementById("messageArea");
    const wasAtBottom = box.scrollHeight - box.scrollTop === box.clientHeight;
    
    box.innerHTML = msgs.map(m => {
      const time = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      return `
        <div class="msg ${m.sender_id == u.id ? 'out' : 'in'}">
          ${m.text}
          <span class="msg-time">${time}</span>
        </div>
      `;
    }).join('');

    // Auto Scroll Logic (First load or if user is at bottom)
    if (wasAtBottom || msgs.length > 0) {
      box.scrollTop = box.scrollHeight;
    }
  } catch(e) { console.error(e); }
}

// Send Message
document.getElementById("sendBtn").addEventListener("click", sendMsg);
document.getElementById("msgInput").addEventListener("keypress", (e) => {
  if(e.key === 'Enter') sendMsg();
});

async function sendMsg() {
  const inp = document.getElementById("msgInput");
  const txt = inp.value.trim();
  if (!txt || !currentChatId) return;
  
  inp.value = "";
  
  // Instant UI Update (Optimistic)
  const box = document.getElementById("messageArea");
  const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  box.innerHTML += `
    <div class="msg out" style="opacity:0.6">
      ${txt} <span class="msg-time">${time} • Sending</span>
    </div>`;
  box.scrollTop = box.scrollHeight;

  // Send to API
  await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id: u.id, receiver_id: currentChatId, text: txt })
  });
  
  loadMessages(); // Refresh to confirm
}

// Helper: Save User
function syncUser() {
  if (u.id) fetch('/api/syncUser', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(u) });
}

// Mock Helper: Load Recent (You need a real API for this later)
async function loadRecentChats() {
  // Filhal yeh khali rakha hai, backend me logic add karna padega "getConversations" ka
  // document.getElementById("recentChatsList").innerHTML = ...
}
