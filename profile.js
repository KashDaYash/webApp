const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- CONFIG ---
const u = tg.initDataUnsafe?.user;
const OWNER_ID = 1302298741; 

let userData = null;
let currentBattle = null;

// --- INITIALIZATION ---
window.onload = () => {
  const gate = document.getElementById("loginGate");
  const app = document.getElementById("app");
  const loader = document.getElementById("loadingScreen");

  if (!u || !u.id) {
    if(loader) loader.style.display = "none";
    if(gate) gate.classList.remove("hidden");
    if(app) app.classList.add("hidden");
    return;
  }

  // Show App
  if(gate) gate.classList.add("hidden");
  if(app) app.classList.remove("hidden");
  document.getElementById("bottomNav").classList.remove("hidden");

  // Initial Sync
  syncUser();
  setTimeout(() => { if(loader) loader.style.display = "none"; }, 500);
};

// --- SYNC USER DATA ---
async function syncUser() {
  try {
    const res = await fetch('/api/syncUser', { 
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(u) 
    });
    userData = await res.json();
    
    // Check Admin Permission
    if (userData.tg_id === OWNER_ID || userData.is_admin) {
        document.getElementById("navAdminBtn").style.display = "flex";
    }

    updateProfileUI();
    loadShop(); 
  } catch(e) { console.error("Sync Failed", e); }
}

// --- UI UPDATER ---
function updateProfileUI() {
  if(!userData) return;
  
  // Header
  document.getElementById("userGold").innerText = userData.coins || 0;
  document.getElementById("heroName").innerText = userData.first_name;
  
  // Character
  const charName = userData.character_name || "Novice";
  document.getElementById("heroCharName").innerText = `${charName}`;
  const charImg = userData.character_image || userData.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  document.getElementById("profileAvatar").src = charImg;

  // Stats
  const maxHp = userData.max_hp || 100;
  const currentHp = userData.hp !== undefined ? userData.hp : maxHp;
  document.getElementById("heroHp").innerText = `${currentHp}/${maxHp}`;
  document.getElementById("heroEnergy").innerText = `${userData.energy || 20}/20`;
  const minDmg = userData.damage_min || 5;
  const maxDmg = userData.damage_max || 10;
  document.getElementById("heroAttack").innerText = `${minDmg}-${maxDmg}`;
  
  // XP
  const xp = userData.xp || 0;
  const maxXp = userData.max_xp || userData.exp_max || 100;
  const xpPercent = Math.min(100, (xp / maxXp) * 100);
  document.getElementById("heroXpBar").style.width = `${xpPercent}%`;
  document.getElementById("xpText").innerText = `${xp}/${maxXp}`;

  // Inventory
  const invGrid = document.getElementById("inventoryList");
  if(userData.inventory && userData.inventory.length > 0) {
    invGrid.innerHTML = userData.inventory.map(item => `
      <div class="item-card">
        <div style="font-size:2rem">🎒</div>
        <div class="item-name">${item.name}</div>
        <div class="item-price" style="font-size:0.7rem; color:#aaa">Owned</div>
      </div>
    `).join('');
  } else {
    invGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;opacity:0.5;padding:10px">Empty Bag</div>`;
  }
}

// --- TAB SWITCHING ---
window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active-page');
  if (navEl) navEl.classList.add('active');
  
  if(tabId === 'tab-shop') loadShop();
  if(tabId === 'tab-leaderboard') loadLeaderboard();
};

// --- LEADERBOARD LOGIC ---
async function loadLeaderboard() {
  const list = document.getElementById("leaderboardList");
  list.innerHTML = `<div style="text-align:center;padding:20px;opacity:0.6">Loading...</div>`;
  
  try {
    const res = await fetch(`/api/search?query=&page=1&myId=${u.id}`); // Reusing search API which sorts by level
    const users = await res.json();
    
    if(!users || users.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:20px;opacity:0.6">No Data</div>`;
        return;
    }

    list.innerHTML = users.map((user, index) => {
      const rank = index + 1;
      let rankColor = "#aaa";
      if(rank === 1) rankColor = "#ffd700"; // Gold
      if(rank === 2) rankColor = "#c0c0c0"; // Silver
      if(rank === 3) rankColor = "#cd7f32"; // Bronze
      
      return `
      <div class="leader-row">
        <div class="leader-left">
          <div class="leader-rank" style="color:${rankColor}">#${rank}</div>
          <img src="${user.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" class="leader-img">
          <div class="leader-info">
             <div>${user.first_name}</div>
             <small>Lvl ${user.level || 1}</small>
          </div>
        </div>
        <div class="leader-score">
           ${user.is_verified ? 'Verified' : ''}
        </div>
      </div>
    `}).join('');
    
  } catch(e) { list.innerHTML = "Error loading."; }
}

// --- BATTLE SYSTEM ---
window.startAdventure = async () => {
  if(userData.hp <= 0) { alert("You are too weak! Heal first."); return; }
  
  document.getElementById("arenaLobby").classList.add("hidden");
  document.getElementById("battleScreen").classList.remove("hidden");
  logBattle("🔍 Searching for monster...");

  try {
    const res = await fetch(`/api/battle?action=start&id=${u.id}`);
    const data = await res.json();
    
    currentBattle = { monster: data.monster, currentMonsterHp: data.monster.hp };
    updateBattleUI();
    logBattle(`⚔️ A wild **${data.monster.name}** appeared!`);
  } catch(e) { logBattle("Error finding monster."); }
};

window.combatAction = async (type) => {
  if(!currentBattle || currentBattle.currentMonsterHp <= 0) return;

  const img = document.getElementById("monsterImage");
  img.style.transform = "scale(0.9)"; setTimeout(()=>img.style.transform="", 150);

  try {
    const res = await fetch('/api/battle', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: type, userId: u.id, monsterId: currentBattle.monster.slug })
    });
    const result = await res.json();
    
    showDamage(result.dmg_dealt);
    userData.hp = result.user_hp;
    userData.coins = result.user_coins;
    
    if(result.dmg_dealt > 0) logBattle(`💥 You dealt ${result.dmg_dealt}.`);
    if(result.dmg_taken > 0) logBattle(`💔 Took ${result.dmg_taken} dmg.`);
    if(result.msg) logBattle(result.msg);

    currentBattle.currentMonsterHp -= result.dmg_dealt;
    const maxHp = currentBattle.monster.max_hp || currentBattle.monster.hp;
    const pct = Math.max(0, (currentBattle.currentMonsterHp / maxHp) * 100);
    document.getElementById("monsterHpBar").style.width = `${pct}%`;

    if (currentBattle.currentMonsterHp <= 0) {
        // WIN
        const winRes = await fetch('/api/battle', {
           method: 'POST', headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({ action: 'claim_win', userId: u.id, monsterId: currentBattle.monster.slug })
        });
        const winData = await winRes.json();
        
        logBattle(`🏆 Victory! +${winData.coins} Coins`);
        if(winData.levelUp) alert("🎉 LEVEL UP!");
        
        setTimeout(() => { closeBattle(); syncUser(); }, 1500);
    } else if (result.outcome === 'loss') {
        alert("💀 You Died!");
        closeBattle(); syncUser();
    } else if (result.outcome === 'fled') {
        closeBattle();
    }
    
    updateProfileUI();

  } catch(e) { console.error(e); }
};

// --- HELPERS ---
function updateBattleUI() {
  if(!currentBattle) return;
  document.getElementById("monsterName").innerText = currentBattle.monster.name;
  document.getElementById("monsterImage").src = currentBattle.monster.image_url || "https://placehold.co/150";
  document.getElementById("monsterHpBar").style.width = `100%`;
}

function closeBattle() {
  document.getElementById("battleScreen").classList.add("hidden");
  document.getElementById("arenaLobby").classList.remove("hidden");
  document.getElementById("battleLog").innerHTML = "";
  currentBattle = null;
}

function logBattle(msg) {
  const log = document.getElementById("battleLog");
  log.innerHTML = `<div class="log-entry">${msg}</div>` + log.innerHTML;
}

function showDamage(amount) {
  if(!amount) return;
  const overlay = document.getElementById("damageOverlay");
  const el = document.createElement("div");
  el.className = "damage-text";
  el.style.left = "50%"; el.style.top = "40%";
  el.innerText = `-${amount}`;
  overlay.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// --- SHOP ---
async function loadShop() {
  const grid = document.getElementById("shopList");
  try {
    const res = await fetch('/api/shop?type=list');
    const items = await res.json();
    grid.innerHTML = items.map(item => `
      <div class="item-card" onclick="buyItem('${item.slug}')">
        <div style="font-size:2rem; margin-bottom:5px">${item.icon || '⚔️'}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-price">💰 ${item.price}</div>
        <div style="font-size:0.7rem; color:#aaa">+${item.power} Effect</div>
      </div>
    `).join('');
  } catch(e) {}
}

window.buyItem = async (slug) => {
  if(!confirm("Buy this item?")) return;
  const res = await fetch('/api/shop', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ action: 'buy', userId: u.id, itemSlug: slug })
  });
  const data = await res.json();
  if(data.success) { alert(data.msg); syncUser(); }
  else alert(data.error);
};

// --- ADMIN ---
window.adminAddItem = async () => {
    const name = document.getElementById("admItemName").value;
    const slug = document.getElementById("admItemSlug").value;
    const price = document.getElementById("admItemPrice").value;
    const power = document.getElementById("admItemPower").value;
    const type = document.getElementById("admItemType").value;

    if(!name || !slug) return;

    await fetch('/api/admin', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            requester_id: u.id, action: 'add_item',
            data: { name, slug, price: Number(price), power: Number(power), type, icon: '🎒' }
        })
    });
    alert("Item Added!");
};

window.adminAddMonster = async () => {
    const name = document.getElementById("admMonName").value;
    const slug = document.getElementById("admMonSlug").value;
    const img = document.getElementById("admMonImg").value;
    const hp = document.getElementById("admMonHp").value;
    const atk = document.getElementById("admMonAtk").value;

    if(!name || !slug) return;

    await fetch('/api/admin', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            requester_id: u.id, action: 'add_monster',
            data: { 
                name, slug, image_url: img, 
                hp: Number(hp), max_hp: Number(hp), attack: Number(atk),
                level: 10, reward_gold: 50
            }
        })
    });
    alert("Monster Added!");
};
