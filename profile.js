const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- STATE ---
const u = tg.initDataUnsafe?.user;
let userData = null;
let currentBattle = null; // Stores monster & battle state

// --- INITIALIZATION ---
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

// --- SYNC USER & UPDATE UI ---
async function syncUser() {
  try {
    // Sync User
    const res = await fetch('/api/syncUser', { 
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(u) 
    });
    userData = await res.json();
    updateProfileUI();
    loadShop(); // Pre-load shop
  } catch(e) { console.error("Sync Failed", e); }
}

function updateProfileUI() {
  if(!userData) return;
  
  // Header
  document.getElementById("userGold").innerText = userData.gold;
  document.getElementById("heroName").innerText = userData.first_name;
  document.getElementById("heroLevel").innerText = userData.level;
  document.getElementById("profileAvatar").src = userData.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // Stats Tab
  document.getElementById("heroHp").innerText = `${userData.hp}/${userData.max_hp}`;
  document.getElementById("heroEnergy").innerText = `${userData.energy || 20}/20`;
  document.getElementById("heroAttack").innerText = userData.attack;
  
  // XP Bar
  const xpPercent = (userData.xp / userData.max_xp) * 100;
  document.getElementById("heroXpBar").style.width = `${xpPercent}%`;
  document.getElementById("xpText").innerText = `${userData.xp}/${userData.max_xp}`;

  // Inventory
  const invGrid = document.getElementById("inventoryList");
  if(userData.inventory && userData.inventory.length > 0) {
    invGrid.innerHTML = userData.inventory.map(item => `
      <div class="item-card">
        <div style="font-size:2rem">⚔️</div>
        <div class="item-name">${item.name}</div>
        <small style="color:var(--text-sec)">Power: ${item.power}</small>
      </div>
    `).join('');
  } else {
    invGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;opacity:0.5">Empty Bag</div>`;
  }
}

// --- BATTLE SYSTEM ---

// 1. Start Fight
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

// 2. Attack
window.performAttack = async () => {
  if(!currentBattle || currentBattle.monster.hp <= 0) return;

  // Animation
  const monsterImg = document.getElementById("monsterImage");
  monsterImg.style.transform = "scale(0.9) rotate(-5deg)"; // Hit effect
  setTimeout(() => monsterImg.style.transform = "", 200);

  try {
    const res = await fetch('/api/battle', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'attack', userId: u.id, monsterId: currentBattle.monster.slug })
    });
    const result = await res.json();
    
    // Update Local State
    currentBattle.monster.hp = result.monster_hp;
    userData.hp = result.user_hp;
    
    // Show Damage Numbers
    showDamage(result.dmg_dealt);

    // Logs
    logBattle(`You hit for <b>${result.dmg_dealt}</b> dmg!`);
    if(result.dmg_taken > 0) logBattle(`Monster hit you for <b>${result.dmg_taken}</b> dmg!`);

    // Check Win/Loss
    if(result.win) {
      logBattle(`🏆 <span style="color:gold">Victory! Found ${result.reward_gold} Gold & ${result.reward_xp} XP.</span>`);
      setTimeout(() => {
        alert(`Victory! +${result.reward_gold} Gold`);
        closeBattle();
        syncUser(); // Refresh stats
      }, 1500);
    } else if(result.user_hp <= 0) {
      logBattle(`💀 You were defeated...`);
      setTimeout(() => {
        alert("You died! HP restored to 50%");
        closeBattle();
        syncUser();
      }, 1500);
    }

    updateBattleUI();
    updateProfileUI(); // Update HP bar in profile

  } catch(e) { console.error(e); }
};

// 3. Heal
window.usePotion = async () => {
  if(userData.gold < 10) { logBattle("Not enough gold (10g) to heal!"); return; }
  
  await fetch('/api/shop', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'heal', userId: u.id })
  });
  logBattle("💚 You drank a potion. HP Restored!");
  syncUser();
};

// 4. Flee
window.fleeBattle = () => {
  logBattle("🏃 You ran away!");
  setTimeout(closeBattle, 1000);
};

// Helper: Update UI
function updateBattleUI() {
  if(!currentBattle) return;
  const m = currentBattle.monster;
  
  document.getElementById("monsterName").innerText = m.name;
  document.getElementById("monsterLvl").innerText = m.level;
  document.getElementById("monsterImage").src = m.image_url;
  
  const hpPercent = (m.hp / m.max_hp) * 100;
  document.getElementById("monsterHpBar").style.width = `${hpPercent}%`;
}

function closeBattle() {
  document.getElementById("battleScreen").classList.add("hidden");
  document.getElementById("arenaLobby").classList.remove("hidden");
  document.getElementById("battleLog").innerHTML = ""; // Clear logs
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
  el.innerText = `-${amount}`;
  overlay.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// --- SHOP LOGIC ---
async function loadShop() {
  const grid = document.getElementById("shopList");
  try {
    const res = await fetch('/api/shop?type=list');
    const items = await res.json();
    
    grid.innerHTML = items.map(item => `
      <div class="item-card" onclick="buyItem('${item.slug}')">
        <div style="font-size:2.5rem">${item.icon || '⚔️'}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-price">💰 ${item.price}</div>
        <div style="font-size:0.7rem;color:#aaa">+${item.power} ${item.stat}</div>
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
  const result = await res.json();
  
  if(result.error) alert(result.error);
  else {
    alert("Item Purchased & Equipped!");
    syncUser();
  }
};

// --- NAVIGATION ---
window.switchTab = (tabId, navEl) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(tabId).classList.add('active-page');
  navEl.classList.add('active');
};
