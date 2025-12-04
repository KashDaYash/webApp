// Command: profile.js

// --- 1. TELEGRAM WEB APP SETUP ---
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableVerticalSwipes();

try { tg.requestFullscreen(); } catch(e){}

// Set App Colors
tg.setHeaderColor("#1c1c1c");
tg.setBackgroundColor("#1e1e1e");
tg.setBottomBarColor("#000000");

// --- 2. GLOBAL VARIABLES ---
const u = tg.initDataUnsafe?.user || {};
let currentChatPartner = null;
let chatPollInterval = null;
let searchTimeout = null;

// --- 3. THEME MANAGEMENT ---
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");
let theme = localStorage.getItem("theme") || tg.colorScheme || "dark";

function applyTheme(name){
  if(name === "light"){
    root.classList.add("light-theme");
    toggle.textContent = "☀️";
  } else {
    root.classList.remove("light-theme");
    toggle.textContent = "🌙";
  }
}

// Apply initial theme
applyTheme(theme);
loadCustomTheme(); // Check if user set custom colors via Color Picker

toggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  toggle.classList.add("animate");
  toggle.addEventListener("animationend", () => toggle.classList.remove("animate"), {once:true});
  applyTheme(theme);
});

// --- 4. POPULATE USER PROFILE ---
document.getElementById("userAvatar").src =
  u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

document.getElementById("userName").textContent =
  [u.first_name, u.last_name].filter(Boolean).join(" ") || "Guest";

if(u.is_premium){
  const p = document.getElementById("userPremium");
  p.classList.remove("hidden");
  p.innerHTML = `💸 Premium`;
}

document.getElementById("userHandle").textContent =
  u.username ? "@" + u.username : "—";

document.getElementById("userId").textContent =
  u.id || "—";

// Language Logic
const langMap = {
  en:"🇬🇧 English", ru:"🇷🇺 Русский", hi:"🇮🇳 हिन्दी",
  es:"🇪🇸 Español", de:"🇩🇪 Deutsch"
};
const code = (u.language_code || "en").split("-")[0];
document.getElementById("userLanguage").textContent =
  langMap[code] || code.toUpperCase();

// --- 5. ANIMATIONS & UI UTILS ---

// Lottie Animation
lottie.loadAnimation({
  container: document.getElementById("lottie"),
  renderer: "svg", loop: true, autoplay: true,
  path: "https://assets2.lottiefiles.com/packages/lf20_jv4xehxh.json"
});

// Copy Tooltip Logic
document.querySelectorAll(".copyable").forEach(el => {
  const span = el.querySelector("span");
  el.addEventListener("click", () => {
    navigator.clipboard.writeText(span.textContent.trim());
    const tt = document.createElement("div");
    tt.className = "tooltip"; tt.textContent = "Copied!";
    el.appendChild(tt);
    requestAnimationFrame(() => tt.style.opacity = 1);
    setTimeout(() => {
      tt.style.opacity = 0;
      setTimeout(() => tt.remove(), 200);
    }, 1000);
  });
});

// Menu Toggle Logic
const menuToggle = document.getElementById("menuToggle");
const menuBody = document.getElementById("menuBody");

menuToggle.addEventListener("click", () => {
  const open = menuBody.style.display === "flex";
  menuBody.style.display = open ? "none" : "flex";
  menuToggle.classList.toggle("rotated", !open);
});

// --- 6. LOADER & DB SYNC ---
let prog = 0;
const bar = document.getElementById("progressBar");
const txt = document.getElementById("progressText");

const interval = setInterval(() => {
  prog += 2; // Thoda fast kar diya
  bar.style.width = prog + "%";
  txt.textContent = prog + "%";

  if(prog >= 100){
    clearInterval(interval);
    
    // 1. Hide Loader
    document.getElementById("loadingScreen").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("loadingScreen").style.display = "none";
      // 2. Show Profile Container
      document.getElementById("mainContainer").style.display = "block"; 
      
      // 3. Setup Main Button
      tg.MainButton.setText("✦ Close App ✦")
        .setParams({has_shine_effect:true})
        .show()
        .onClick(() => tg.close());
        
      // 4. Sync User with Database (Important for Search)
      syncUserToDB(); 
      
    }, 300);
  }
}, 20); // Speed

async function syncUserToDB() {
  if(!u.id) return; // Guest user handling
  try {
    await fetch('/api/syncUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tg_id: u.id,
        username: u.username,
        first_name: u.first_name,
        photo_url: u.photo_url
      })
    });
    console.log("User Synced to DB");
  } catch(e) {
    console.error("Sync Error:", e);
  }
}

// --- 7. CHAT SYSTEM LOGIC ---

// DOM Elements
const chatOverlay = document.getElementById('chatOverlay');
const mainContainer = document.getElementById('mainContainer');
const chatListView = document.getElementById('chatListView');
const chatRoomView = document.getElementById('chatRoomView');
const searchInput = document.getElementById('userSearch');
const suggestionList = document.getElementById('suggestionList');

// A. Open/Close Chat Interface
window.openChatInterface = () => {
  chatOverlay.classList.remove('hidden');
  mainContainer.style.display = 'none'; // Profile hide
  tg.BackButton.show();
  tg.BackButton.onClick(closeChatInterface);
  tg.MainButton.hide(); // Hide close button inside chat
};

window.closeChatInterface = () => {
  chatOverlay.classList.add('hidden');
  mainContainer.style.display = 'block'; // Profile show
  tg.BackButton.hide();
  tg.MainButton.show();
  
  // Reset Views
  chatListView.classList.remove('hidden');
  chatRoomView.classList.add('hidden');
  if(chatPollInterval) clearInterval(chatPollInterval);
};

// B. Search Users (Debounced)
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  
  if (query.length === 0) {
    suggestionList.innerHTML = '';
    return;
  }

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => performSearch(query), 300);
});

async function performSearch(query) {
  try {
    suggestionList.innerHTML = `<div style="padding:15px;text-align:center;opacity:0.6;">Searching...</div>`;
    const res = await fetch(`/api/search?query=${query}`);
    const users = await res.json();

    if (users.length === 0) {
      suggestionList.innerHTML = `<div style="padding:15px;text-align:center;opacity:0.5;">No user found</div>`;
      return;
    }

    suggestionList.innerHTML = users.map(user => `
      <div class="user-item" onclick="startChat(${user.tg_id}, '${user.first_name}')">
        <img src="${user.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div>
          <div style="font-weight:600">${user.first_name}</div>
          <div style="font-size:0.8rem; opacity:0.7">@${user.username || 'unknown'}</div>
        </div>
      </div>
    `).join('');
  } catch(e) { console.error(e); }
}

// C. Enter Chat Room
window.startChat = (partnerId, partnerName) => {
  currentChatPartner = partnerId;
  
  // UI Switch
  chatListView.classList.add('hidden');
  chatRoomView.classList.remove('hidden');
  document.getElementById('chatPartnerName').textContent = partnerName;
  
  // Back Button Logic
  tg.BackButton.onClick(window.backToChatList);
  
  // Load Messages & Start Polling
  loadMessages();
  if(chatPollInterval) clearInterval(chatPollInterval);
  chatPollInterval = setInterval(loadMessages, 3000); // Check every 3 seconds
};

window.backToChatList = () => {
  chatRoomView.classList.add('hidden');
  chatListView.classList.remove('hidden');
  if(chatPollInterval) clearInterval(chatPollInterval);
  tg.BackButton.onClick(closeChatInterface);
};

// D. Load Messages
async function loadMessages() {
  if(!currentChatPartner || !u.id) return;
  
  try {
    const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatPartner}`);
    const msgs = await res.json();
    
    const area = document.getElementById('messageArea');
    
    // Only update if needed (simple check) to avoid flicker
    // For now, we rebuild. In advanced apps, we append.
    area.innerHTML = msgs.map(m => `
      <div class="msg ${m.sender_id == u.id ? 'out' : 'in'}">
        ${m.text}
      </div>
    `).join('');
    
    // Auto Scroll to bottom
    // area.scrollTop = area.scrollHeight; 
  } catch(e){ console.error(e); }
}

// E. Send Message
document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('msgInput').addEventListener('keypress', (e) => {
  if(e.key === 'Enter') sendMessage();
});

async function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if(!text || !currentChatPartner) return;

  // Clear input immediately for UX
  input.value = "";
  
  // Optimistic UI: Show message immediately (Optional, but looks faster)
  const area = document.getElementById('messageArea');
  area.innerHTML += `<div class="msg out" style="opacity:0.5">${text}</div>`;
  area.scrollTop = area.scrollHeight;

  try {
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: u.id,
        receiver_id: currentChatPartner,
        text: text
      })
    });
    loadMessages(); // Refresh to confirm/update timestamp
  } catch(e) {
    alert("Failed to send");
  }
}

// --- 8. THEME EDITOR HELPER ---
function loadCustomTheme() {
  const t = JSON.parse(localStorage.getItem('customTheme'));
  if(t) {
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--bg', t.bg);
  }
}
