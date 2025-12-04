// profile.js ke andar performSearch function update karein

async function performSearch(query) {
  try {
    // UI Feedback
    suggestions.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.6;">Searching "${query}"...</div>`;

    // FIX: URL me '&myId=' add kiya taaki khud ki ID bhejein
    // u.id wahi variable hai jo upar defined hai (Logged in user)
    const res = await fetch(`/api/search?query=${query}&myId=${u.id}`);
    
    if (!res.ok) throw new Error("API Error");
    
    const data = await res.json();

    if (!data || data.length === 0) {
      suggestions.innerHTML = `<div style="padding:20px;text-align:center;opacity:0.5;">No users found</div>`;
      return;
    }

    // Render Results
    suggestions.innerHTML = data.map(usr => `
      <div class="user-item" onclick="openChatRoom(${usr.tg_id}, '${usr.first_name}', '${usr.photo_url}')">
        <img src="${usr.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}">
        <div style="flex:1">
           <div style="font-weight:600">${usr.first_name}</div>
           <div style="font-size:0.8rem; opacity:0.7">@${usr.username || 'unknown'}</div>
        </div>
        <span class="material-icons-round" style="color:var(--accent)">chat</span>
      </div>
    `).join('');
    
  } catch (e) {
    console.error(e);
    suggestions.innerHTML = `<div style="padding:20px;text-align:center;color:red;">Error searching</div>`;
  }
}
