// Command: profile.js
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// DOM Elements
const views = {
  profile: document.getElementById('view-profile'),
  chatlist: document.getElementById('view-chatlist'),
  chatroom: document.getElementById('view-chatroom'),
  theme: document.getElementById('view-theme')
};

let currentUser = tg.initDataUnsafe?.user || { id: 12345, first_name: "Test", username: "tester" }; // Fallback for dev
let currentChatPartner = null;

// --- 1. Initialization & DB Sync ---
async function init() {
  // Sync user with MongoDB
  try {
    await fetch('/api/syncUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tg_id: currentUser.id,
        username: currentUser.username,
        first_name: currentUser.first_name,
        photo_url: currentUser.photo_url
      })
    });
  } catch(e) { console.error("Sync Failed", e); }
  
  // UI Setup
  document.getElementById("userName").textContent = currentUser.first_name;
  document.getElementById("userAvatar").src = currentUser.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  loadTheme();
}

// --- 2. Navigation ---
window.switchView = (viewName) => {
  Object.values(views).forEach(el => el.classList.remove('active'));
  views[viewName.replace('view-', '')].classList.add('active');
  
  if (viewName === 'view-profile') tg.BackButton.hide();
  else {
    tg.BackButton.show();
    tg.BackButton.onClick(() => switchView('view-profile'));
  }
};

document.getElementById('openChatBtn').addEventListener('click', () => switchView('view-chatlist'));
document.getElementById('themeEditBtn').addEventListener('click', () => switchView('view-theme'));

// --- 3. Chat System ---

// Search Users
const searchInput = document.getElementById('userSearch');
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value;
  if (query.length < 3) return;
  
  const res = await fetch(`/api/search?query=${query}`);
  const users = await res.json();
  
  const list = document.getElementById('searchResults');
  list.classList.remove('hidden');
  list.innerHTML = users.map(u => `
    <div class="user-item" onclick="openChat(${u.tg_id}, '${u.first_name}')">
      <img src="${u.photo_url || 'https://placehold.co/50'}">
      <div><b>${u.first_name}</b><br><small>@${u.username}</small></div>
    </div>
  `).join('');
});

// Open Chat Room
window.openChat = async (partnerId, partnerName) => {
  currentChatPartner = partnerId;
  document.getElementById('chatPartnerName').textContent = partnerName;
  switchView('view-chatroom');
  loadMessages();
  // Start polling for new messages
  if(window.chatInterval) clearInterval(window.chatInterval);
  window.chatInterval = setInterval(loadMessages, 3000);
};

// Load Messages
async function loadMessages() {
  if(!currentChatPartner) return;
  const res = await fetch(`/api/chat?u1=${currentUser.id}&u2=${currentChatPartner}`);
  const msgs = await res.json();
  
  const area = document.getElementById('messageArea');
  area.innerHTML = msgs.map(m => `
    <div class="msg ${m.sender_id === currentUser.id ? 'out' : 'in'}">
      ${m.text}
    </div>
  `).join('');
  area.scrollTop = area.scrollHeight; // Scroll to bottom
}

// Send Message
document.getElementById('sendBtn').addEventListener('click', async () => {
  const txt = document.getElementById('msgInput');
  if (!txt.value) return;
  
  await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender_id: currentUser.id,
      receiver_id: currentChatPartner,
      text: txt.value
    })
  });
  
  txt.value = "";
  loadMessages();
});

// --- 4. Theme Editor ---
const accentPicker = document.getElementById('accentPicker');
const bgPicker = document.getElementById('bgPicker');
const root = document.documentElement;

function loadTheme() {
  const t = JSON.parse(localStorage.getItem('customTheme'));
  if(t) {
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--bg', t.bg);
    accentPicker.value = t.accent;
    bgPicker.value = t.bg;
  }
}

[accentPicker, bgPicker].forEach(p => {
  p.addEventListener('input', () => {
    const themeData = { accent: accentPicker.value, bg: bgPicker.value };
    root.style.setProperty('--accent', themeData.accent);
    root.style.setProperty('--bg', themeData.bg);
    localStorage.setItem('customTheme', JSON.stringify(themeData));
  });
});

window.resetTheme = () => {
  localStorage.removeItem('customTheme');
  location.reload();
}

// Start
init();
 
