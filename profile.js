const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.setHeaderColor("#0f0f0f"); 
tg.setBackgroundColor("#0f0f0f");

// User Data
const u = tg.initDataUnsafe?.user || { id: 12345, first_name: "Demo", username: "demo_user" };

// --- 1. INITIALIZATION ---
window.onload = () => {
  // Simulate sync
  syncUser();
  
  // Fill Profile
  document.getElementById("userName").textContent = u.first_name;
  document.getElementById("userHandle").textContent = u.username ? "@"+u.username : "No handle";
  document.getElementById("userId").textContent = u.id;
  document.getElementById("userAvatar").src = u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  // Loader Animation
  let p = 0;
  const bar = document.getElementById("progressBar");
  const interval = setInterval(() => {
    p += 5; bar.style.width = p + "%";
    if(p >= 100) {
      clearInterval(interval);
      document.getElementById("loadingScreen").style.opacity = 0;
      setTimeout(()=> document.getElementById("loadingScreen").style.display="none", 300);
    }
  }, 30);
};

// --- 2. TAB NAVIGATION ---
window.switchTab = (tabId, navEl) => {
  // Remove active class from all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  // Remove active class from all nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  // Activate selected
  document.getElementById(tabId).classList.add('active-page');
  navEl.classList.add('active');

  // Haptics
  tg.HapticFeedback.selectionChanged();
};

// --- 3. SEARCH & CHAT LOGIC ---
const searchInput = document.getElementById("userSearch");
const suggestions = document.getElementById("suggestionList");
let searchTimer;

searchInput.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  if(!val) { suggestions.innerHTML = ""; return; }
  
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => runSearch(val), 300);
});

async function runSearch(query) {
  try {
    const res = await fetch(`/api/search?query=${query}`);
    const data = await res.json();
    
    document.getElementById("emptyChatState").style.display = data.length ? "none" : "block";
    
    suggestions.innerHTML = data.map(usr => `
      <div class="user-item" onclick="openChatRoom(${usr.tg_id}, '${usr.first_name}', '${usr.photo_url}')">
        <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div>
           <div style="font-weight:600; font-size:1rem;">${usr.first_name}</div>
           <div style="font-size:0.8rem; opacity:0.6;">@${usr.username}</div>
        </div>
      </div>
    `).join('');
  } catch(e){ console.error(e); }
}

// --- 4. CHAT ROOM LOGIC ---
let currentChatId = null;
let pollInterval = null;

window.openChatRoom = (id, name, photo) => {
  currentChatId = id;
  const overlay = document.getElementById("chatRoom");
  
  // Setup Header
  document.getElementById("chatPartnerName").textContent = name;
  document.getElementById("chatPartnerImg").src = photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  // Show with Animation
  overlay.classList.add("open");
  tg.BackButton.show();
  tg.BackButton.onClick(closeChatRoom);
  
  // Load Messages
  loadMessages();
  pollInterval = setInterval(loadMessages, 3000);
};

window.closeChatRoom = () => {
  document.getElementById("chatRoom").classList.remove("open");
  tg.BackButton.hide();
  clearInterval(pollInterval);
  currentChatId = null;
};

async function loadMessages() {
  if(!currentChatId) return;
  const res = await fetch(`/api/chat?u1=${u.id}&u2=${currentChatId}`);
  const msgs = await res.json();
  const box = document.getElementById("messageArea");
  
  // Simple Render (In production, compare IDs to avoid flicker)
  box.innerHTML = msgs.map(m => `
    <div class="msg ${m.sender_id == u.id ? 'out' : 'in'}">${m.text}</div>
  `).join('');
}

// Send Message
document.getElementById("sendBtn").addEventListener("click", sendMsg);
async function sendMsg() {
  const inp = document.getElementById("msgInput");
  const txt = inp.value.trim();
  if(!txt || !currentChatId) return;
  
  inp.value = "";
  // Optimistic UI
  document.getElementById("messageArea").innerHTML += `<div class="msg out" style="opacity:0.7">${txt}</div>`;
  
  await fetch('/api/chat', {
    method:'POST', 
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ sender_id: u.id, receiver_id: currentChatId, text: txt })
  });
  loadMessages();
}

function syncUser(){
  if(u.id) fetch('/api/syncUser', { method:'POST', body: JSON.stringify(u) });
}
