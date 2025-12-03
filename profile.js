/* --- NEW: CHAT & SEARCH SYSTEM --- */

const chatOverlay = document.getElementById('chatOverlay');
const mainContainer = document.getElementById('mainContainer');
const searchInput = document.getElementById('userSearch');
const suggestionList = document.getElementById('suggestionList');
let searchTimeout;

// 1. Open/Close Logic
function openChatInterface() {
  chatOverlay.classList.remove('hidden');
  mainContainer.style.display = 'none'; // Background hide kar do performance ke liye
  tg.BackButton.show();
  tg.BackButton.onClick(closeChatInterface);
}

function closeChatInterface() {
  chatOverlay.classList.add('hidden');
  mainContainer.style.display = 'block';
  tg.BackButton.hide();
  // Reset view
  document.getElementById('chatListView').classList.remove('hidden');
  document.getElementById('chatRoomView').classList.add('hidden');
}

// 2. Type-as-you-go Search (Debounced)
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  
  // Clear old results if empty
  if(query.length === 0) {
    suggestionList.innerHTML = '';
    return;
  }

  // Thoda wait karo taaki server par load kam pade (300ms)
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => performSearch(query), 300);
});

async function performSearch(query) {
  try {
    // Show Loading Skeleton or Text
    suggestionList.innerHTML = `<div style="text-align:center; opacity:0.6;">Searching "${query}"...</div>`;

    const res = await fetch(`/api/search?query=${query}`);
    const users = await res.json();

    if(users.length === 0) {
      suggestionList.innerHTML = `<div style="text-align:center; opacity:0.5;">No user found</div>`;
      return;
    }

    // Render List
    suggestionList.innerHTML = users.map(u => `
      <div class="user-item" onclick="startChat(${u.tg_id}, '${u.first_name}')">
        <img src="${u.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div>
          <div style="font-weight:600">${u.first_name}</div>
          <div style="font-size:0.8rem; opacity:0.7">@${u.username || 'unknown'}</div>
        </div>
      </div>
    `).join('');
    
  } catch(e) {
    console.error(e);
  }
}

// 3. Start Chat (UI Switch)
window.startChat = (id, name) => {
  document.getElementById('chatListView').classList.add('hidden');
  document.getElementById('chatRoomView').classList.remove('hidden');
  document.getElementById('chatPartnerName').textContent = name;
  
  tg.BackButton.onClick(backToChatList);
  
  // Load messages logic (Aapka existing chat logic yahan aayega)
  // loadMessages(id);
};

function backToChatList() {
  document.getElementById('chatRoomView').classList.add('hidden');
  document.getElementById('chatListView').classList.remove('hidden');
  tg.BackButton.onClick(closeChatInterface);
}

// Ensure User is synced on load
window.onload = async () => {
    // ... (Old loader logic) ...
    // Sync current user silently
    if(u.id) {
        fetch('/api/syncUser', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                tg_id: u.id,
                username: u.username,
                first_name: u.first_name,
                photo_url: u.photo_url
            })
        });
    }
};
 
