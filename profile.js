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
    
    // Check Admin Permission for Nav Button
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
  
  // Character Info (Fixes Undefined)
  const charName = userData.character_name || "Novice";
  document.getElementById("heroCharName").innerText = `${charName} (Lvl ${userData.level || 1})`;
  
  const charImg = userData.character_image || userData.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  document.getElementById("profileAvatar").src = charImg;

  // Stats
  const maxHp = userData.max_hp || 100;
  const currentHp = userData.hp !== undefined ? userData.hp : maxHp;
  document.getElementById("heroHp").innerText = `${currentHp}/${maxHp}`;
  document.getElementById("heroEnergy").innerText = `${userData.energy || 20}/20`;
  
  // Damage
  const minDmg = userData.damage_min || 5;
  const maxDmg = userData.damage_max || 10;
  document.getElementById("heroAttack").innerText = `${minDmg}-${maxDmg}`;
  
  // XP Bar
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
};

// --- BATTLE SYSTEM ---

// 1. Start
window.startAdventure = async () => {
  if(userData.hp <= 0) { alert("You are too weak! Heal first."); return; }
  
  document.getElementById("arenaLobby").classList.add("hidden");
  document.getElementById("battleScreen").classList.remove("hidden");
  logBattle("🔍 Searching for monster...");

  try {
    const res = await fetch(`/api/battle?action=start&id=${u.id}`);
    const data = await res.json();
    
    // Store Monster State Locally
    currentBattle = { 
        monster: data.monster, 
        currentMonsterHp: data.monster.hp 
    };
    
    updateBattleUI();
    logBattle(`⚔️ A wild **${data.monster.name}** appeared!`);
  } catch(e) { logBattle("Error finding monster."); }
};

// 2. Combat Action (Attack, Dodge, Heal, Flee)
window.combatAction = async (type) => {
  if(!currentBattle || currentBattle.currentMonsterHp <= 0) return;

  // Visual Animation
  const img = document.getElementById("monsterImage");
  img.style.transform = "scale(0.9)"; setTimeout(()=>img.style.transform="", 150);

  try {
    const res = await fetch('/api/battle', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: type, userId: u.id, monsterId: currentBattle.monster.slug })
    });
    const result = await res.json();
    
    // Updates
    userData.hp = result.user_hp;
    userData.coins = result.user_coins;
    
    if(result.dmg_dealt > 0) showDamage(result.dmg_dealt);
    logBattle(result.msg);

    // Monster HP Logic
    currentBattle.currentMonsterHp -= result.dmg_dealt;
    const maxHp = currentBattle.monster.hp || currentBattle.monster.max_hp;
    const pct = Math.max(0, (currentBattle.currentMonsterHp / maxHp) * 100);
    document.getElementById("monsterHpBar").style.width = `${pct}%`;

    // Check Outcome
    if (currentBattle.currentMonsterHp <= 0) {
        alert(`🏆 VICTORY! +${result.reward_coins || 0} Coins`);
        closeBattle();
        syncUser();
    } else if (result.outcome === 'loss') {
        alert("💀 You Died!");
        closeBattle();
        syncUser();
    } else if (result.outcome === 'fled') {
        closeBattle();
    }
    
    updateProfileUI(); // Update Health/Coins

  } catch(e) { console.error(e); }
};

// Helpers
function updateBattleUI() {
  if(!currentBattle) return;
  const m = currentBattle.monster;
  
  document.getElementById("monsterName").innerText = m.name;
  document.getElementById("monsterImage").src = m.image_url || m.img || "https://placehold.co/150";
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
