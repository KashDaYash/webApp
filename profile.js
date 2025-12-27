const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const u = tg.initDataUnsafe?.user;
let userData = null;
let shopItems = [];
let currentBattle = null;

// --- INITIALIZATION ---
window.onload = () => {
  if (!u) {
    document.body.innerHTML = "<h2 style='text-align:center;margin-top:50px'>Open in Telegram</h2>";
    return;
  }
  
  // Load User Data
  syncUser();
};

async function syncUser() {
  try {
    const res = await fetch('/api/syncUser', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(u) 
    });
    userData = await res.json();
    
    applyTheme(userData.theme || 'dark');
    updateProfileUI();
    
    // Show Admin Tab if owner
    if (userData.is_owner) document.getElementById('navAdmin').classList.remove('hidden');
    
    document.getElementById('loadingScreen').classList.add('hidden');
  } catch(e) { console.error(e); }
}

// --- PROFILE UI ---
function updateProfileUI() {
  if(!userData) return;
  
  // Header
  document.getElementById('userAvatar').src = userData.avatar || "https://placehold.co/100";
  document.getElementById('userName').textContent = userData.name;
  document.getElementById('userHandle').textContent = userData.username ? `@${userData.username}` : '';
  
  // Stats
  document.getElementById('statHp').textContent = userData.hp;
  document.getElementById('statAtk').textContent = userData.attack;
  document.getElementById('statDef').textContent = userData.defense;
  document.getElementById('statSpd').textContent = userData.speed;
  
  // XP
  document.getElementById('userLevel').textContent = userData.level;
  document.getElementById('xpText').textContent = `${userData.xp} / ${userData.max_xp} XP`;
  const pct = (userData.xp / userData.max_xp) * 100;
  document.getElementById('xpBarFill').style.width = `${pct}%`;
  
  // Coins in Shop Header
  const shopCoinEl = document.getElementById('shopCoins');
  if(shopCoinEl) shopCoinEl.textContent = userData.coins;
}

// --- THEME SYSTEM ---
function toggleTheme() {
  const newTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
  applyTheme(newTheme);
  
  // Save to DB (Optional: create api endpoint for this specific update or use sync)
  // For now, we assume next sync updates it or we rely on local
}

function applyTheme(theme) {
  const icon = document.getElementById('themeIcon');
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    icon.textContent = '🌞';
  } else {
    document.body.classList.remove('light-theme');
    icon.textContent = '🌙';
  }
}

// --- BATTLE SYSTEM ---
async function startBattle(mode) {
  document.getElementById('battleOverlay').classList.remove('hidden');
  document.getElementById('battleLog').innerHTML = "Searching for opponent...";
  
  const res = await fetch('/api/battle', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ action: 'find_match', telegramId: u.id, mode })
  });
  const data = await res.json();
  
  if (data.error) {
    document.getElementById('battleLog').innerHTML = data.error;
    return;
  }
  
  currentBattle = data.enemy;
  currentBattle.maxHp = data.enemy.hp; // Store max for bar
  
  document.getElementById('enemyName').textContent = data.enemy.name;
  document.getElementById('enemyImg').src = data.enemy.image;
  document.getElementById('enemyHpBar').style.width = "100%";
  document.getElementById('battleLog').innerHTML = `Encountered ${data.enemy.name}!`;
}

async function performAttack() {
  if (!currentBattle) return;
  
  // Visual Update
  const log = document.getElementById('battleLog');
  
  // API Call
  const res = await fetch('/api/battle', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ action: 'attack', telegramId: u.id })
  });
  const data = await res.json();
  
  log.innerHTML = `You dealt <b>${data.dmg}</b> damage!`;
  
  // Update Enemy HP (Client Side Simulation)
  currentBattle.hp -= data.dmg;
  const pct = Math.max(0, (currentBattle.hp / currentBattle.maxHp) * 100);
  document.getElementById('enemyHpBar').style.width = `${pct}%`;
  
  if (currentBattle.hp <= 0) {
    log.innerHTML = "🏆 You Won!";
    await fetch('/api/battle', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'result', telegramId: u.id, win: true })
    });
    setTimeout(() => { closeBattle(); syncUser(); }, 1500);
  }
}

function closeBattle() {
  document.getElementById('battleOverlay').classList.add('hidden');
  currentBattle = null;
}

// --- SHOP ---
async function loadShop() {
  const res = await fetch('/api/shop');
  shopItems = await res.json();
  filterShop('Fruits'); // Default category
}

function filterShop(category) {
  // Update Tabs
  document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active'); // Needs event passed or handle logic
  
  const container = document.getElementById('shopGrid');
  container.innerHTML = '';
  
  const items = shopItems.filter(i => i.category === category);
  
  items.forEach(item => {
    container.innerHTML += `
      <div class="mode-card" onclick="buyItem('${item._id}')">
        <div style="font-size:2rem">${item.image || '📦'}</div>
        <h3>${item.name}</h3>
        <p>${item.description || 'No desc'}</p>
        <b style="color:var(--accent)">💰 ${item.price}</b>
      </div>
    `;
  });
}

async function buyItem(itemId) {
  if(!confirm("Buy this item?")) return;
  
  const res = await fetch('/api/shop', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ action: 'buy', telegramId: u.id, itemId })
  });
  const data = await res.json();
  
  if(data.success) {
    alert("Purchased!");
    syncUser();
  } else {
    alert(data.error);
  }
}

// --- LEADERBOARD ---
// Call this when switching to leaderboard tab
async function loadLeaderboard() {
  const res = await fetch('/api/search');
  const users = await res.json();
  const list = document.getElementById('leaderboardList');
  
  list.innerHTML = users.map((user, i) => `
    <div class="leader-row">
      <b style="width:30px; color:var(--accent)">#${i+1}</b>
      <img src="${user.avatar || 'https://placehold.co/50'}" style="width:40px;height:40px;border-radius:50%;margin:0 10px">
      <div style="flex:1">
        <div>${user.name}</div>
        <small style="opacity:0.6">Lvl ${user.level}</small>
      </div>
      <div style="color:gold">💰 ${user.coins}</div>
    </div>
  `).join('');
}

// --- NAVIGATION ---
window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active-page');
  navEl.classList.add('active');
  
  if(tabId === 'tab-leaderboard') loadLeaderboard();
};
