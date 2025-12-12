const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- STATE ---
const u = tg.initDataUnsafe?.user;
const OWNER_ID = 1302298741; 
let userData = null;
let currentBattle = null;

// --- INIT ---
window.onload = () => {
  const gate = document.getElementById("loginGate");
  const app = document.getElementById("app");
  
  if (!u || !u.id) {
    document.getElementById("loadingScreen").style.display = "none";
    if(gate) gate.classList.remove("hidden");
    if(app) app.classList.add("hidden");
    return;
  }

  if(gate) gate.classList.add("hidden");
  if(app) app.classList.remove("hidden");
  document.getElementById("bottomNav").classList.remove("hidden");

  syncUser();
  setTimeout(() => document.getElementById("loadingScreen").style.display = "none", 500);
};

// --- SYNC ---
async function syncUser() {
  try {
    const res = await fetch('/api/syncUser', { 
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(u) 
    });
    userData = await res.json();
    
    // Check if Admin, else hide Admin Nav Button visually (Optional)
    // If you want everyone to see button but get rejected: leave as is.
    // If you want to hide button for non-admins:
    if (userData.tg_id !== OWNER_ID && !userData.is_admin) {
        document.getElementById("navAdminBtn").style.display = "none";
    }

    updateProfileUI();
    loadShop();
  } catch(e) { console.error("Sync Failed", e); }
}

function updateProfileUI() {
  if(!userData) return;
  document.getElementById("userGold").innerText = userData.gold;
  document.getElementById("heroName").innerText = userData.first_name;
  document.getElementById("heroLevel").innerText = userData.level;
  document.getElementById("profileAvatar").src = userData.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  
  document.getElementById("heroHp").innerText = `${userData.hp}/${userData.max_hp}`;
  document.getElementById("heroEnergy").innerText = `${userData.energy}/20`;
  document.getElementById("heroAttack").innerText = userData.attack;
  
  const xpPercent = (userData.xp / userData.max_xp) * 100;
  document.getElementById("heroXpBar").style.width = `${xpPercent}%`;
  document.getElementById("xpText").innerText = `${userData.xp}/${userData.max_xp}`;

  const invGrid = document.getElementById("inventoryList");
  if(userData.inventory && userData.inventory.length > 0) {
    invGrid.innerHTML = userData.inventory.map(item => `
      <div class="item-card">
        <div style="font-size:2rem">🎒</div>
        <div class="item-name">${item.name}</div>
        <small style="color:#aaa">Owned</small>
      </div>
    `).join('');
  } else {
    invGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;opacity:0.5">Empty Bag</div>`;
  }
}

// --- TAB SWITCHING (FIXED) ---
window.switchTab = (tabId, navEl) => {
  // 1. Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  
  // 2. Remove 'active' from ALL nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  // 3. Show Target Page
  document.getElementById(tabId).classList.add('active-page');
  
  // 4. Highlight Clicked Button
  if (navEl) {
      navEl.classList.add('active');
  }
  
  // Refresh Data if needed
  if(tabId === 'tab-shop') loadShop();
};

// --- BATTLE ---
window.startAdventure = async () => {
  if(userData.hp <= 0) { alert("You are dead! Heal first."); return; }
  document.getElementById("arenaLobby").classList.add("hidden");
  document.getElementById("battleScreen").classList.remove("hidden");
  logBattle("🔍 Searching for monster...");

  try {
    const res = await fetch(`/api/battle?action=start&id=${u.id}`);
    const data = await res.json();
    currentBattle = data;
    updateBattleUI();
    logBattle(`⚔️ A wild **${data.monster.name}** appeared!`);
  } catch(e) { logBattle("Error finding monster."); }
};

window.performAttack = async () => {
  if(!currentBattle || currentBattle.monster.hp <= 0) return;
  
  // Animation
  const img = document.getElementById("monsterImage");
  img.style.transform = "scale(0.9) rotate(-5deg)";
  setTimeout(() => img.style.transform = "", 200);

  try {
    const res = await fetch('/api/battle', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'attack', userId: u.id, monsterId: currentBattle.monster.slug })
    });
    const result = await res.json();
    
    currentBattle.monster.hp = result.monster_hp; // Backend sends updated HP logic needed or client tracking
    // For now assume client tracks visual HP based on damage
    // Note: In previous chat I simplified battle.js to return damage.
    // Let's assume we update visual bar:
    
    // Better Logic:
    // We assume monster started at MAX HP. We subtract damage.
    // Since we don't have persistent battle state in DB, this is client-side visual mainly.
    // Let's rely on what we have.
    
    showDamage(result.dmg_dealt);
    userData.hp = result.user_hp;
    
    // Calculate Monster %
    // We need monster max hp stored in currentBattle
    let currentHP = (currentBattle.monster.currentHp || currentBattle.monster.max_hp) - result.dmg_dealt;
    currentBattle.monster.currentHp = currentHP;
    
    if (currentHP <= 0) {
       // WIN
       await fetch('/api/battle', {
           method: 'POST', headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({ action: 'claim_win', userId: u.id, monsterId: currentBattle.monster.slug })
       });
       logBattle("🏆 VICTORY!");
       setTimeout(() => {
           alert("Victory!");
           closeBattle();
           syncUser();
       }, 1000);
    } else {
        logBattle(`You hit ${result.dmg_dealt}. Monster hit ${result.dmg_taken}.`);
    }
    
    updateBattleUI();
    updateProfileUI();

  } catch(e) { console.error(e); }
};

window.usePotion = async () => {
  const res = await fetch('/api/shop', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'heal', userId: u.id })
  });
  const data = await res.json();
  if(data.success) {
      userData.hp = data.hp;
      userData.gold = data.gold;
      updateProfileUI();
      logBattle("💚 Healed!");
  } else {
      logBattle("Not enough gold!");
  }
};

window.fleeBattle = () => {
  logBattle("🏃 You ran away!");
  setTimeout(closeBattle, 1000);
};

function updateBattleUI() {
  if(!currentBattle) return;
  const m = currentBattle.monster;
  document.getElementById("monsterName").innerText = m.name;
  document.getElementById("monsterLvl").innerText = m.lvl;
  document.getElementById("monsterImage").src = m.img; // Ensure API sends 'img'
  
  // HP Bar Calc
  let current = m.currentHp !== undefined ? m.currentHp : m.max_hp; // Handle undefined on start
  if (m.currentHp === undefined) m.currentHp = m.max_hp; // Set initial
  
  const pct = Math.max(0, (current / m.max_hp) * 100);
  document.getElementById("monsterHpBar").style.width = `${pct}%`;
}

function closeBattle() {
  document.getElementById("battleScreen").classList.add("hidden");
  document.getElementById("arenaLobby").classList.remove("hidden");
  document.getElementById("battleLog").innerHTML = "";
  currentBattle = null;
}

function logBattle(msg) {
  const log = document.getElementById("battleLog");
  log.innerHTML += `<div class="log-entry">${msg}</div>`;
  log.scrollTop = log.scrollHeight;
}

function showDamage(amount) {
  const overlay = document.getElementById("damageOverlay");
  const el = document.createElement("div");
  el.className = "damage-text";
  el.style.position = "absolute"; el.style.color = "white"; el.style.fontWeight="bold";
  el.style.left = "50%"; el.style.top = "50%"; el.style.transform = "translate(-50%, -50%)";
  el.style.fontSize = "2rem"; el.style.textShadow = "0 0 5px red";
  el.innerText = `-${amount}`;
  overlay.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// --- SHOP ---
async function loadShop() {
  const grid = document.getElementById("shopList");
  const res = await fetch('/api/shop?type=list');
  const items = await res.json();
  grid.innerHTML = items.map(item => `
    <div class="item-card" onclick="buyItem('${item.slug}')">
      <div style="font-size:2rem">${item.icon}</div>
      <div class="item-name">${item.name}</div>
      <div class="item-price">💰 ${item.price}</div>
    </div>
  `).join('');
}

window.buyItem = async (slug) => {
  if(!confirm("Buy Item?")) return;
  const res = await fetch('/api/shop', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ action: 'buy', userId: u.id, itemSlug: slug })
  });
  const data = await res.json();
  if(data.success) { alert("Bought!"); syncUser(); }
  else alert(data.error);
};

// --- ADMIN ---
window.addNewItem = async () => {
    const name = document.getElementById("newItemName").value;
    const price = document.getElementById("newItemPrice").value;
    if(!name || !price) return;
    
    // Call Admin API (You need to implement this in backend if you want dynamic items)
    alert("Feature needs Backend Admin Logic connected.");
};
