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
    loadShop(); // Load shop items in background
  } catch(e) { console.error("Sync Failed", e); }
}

// --- UI UPDATER ---
function updateProfileUI() {
  if(!userData) return;
  
  // Header
  document.getElementById("userGold").innerText = userData.gold || 0;
  document.getElementById("heroName").innerText = userData.first_name;
  document.getElementById("heroLevel").innerText = userData.level || 1;
  document.getElementById("profileAvatar").src = userData.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  // Stats
  const maxHp = userData.max_hp || 100;
  const currentHp = userData.hp !== undefined ? userData.hp : maxHp;
  document.getElementById("heroHp").innerText = `${currentHp}/${maxHp}`;
  document.getElementById("heroEnergy").innerText = `${userData.energy || 20}/20`;
  document.getElementById("heroAttack").innerText = userData.attack || 10;
  
  // XP Bar
  const xp = userData.xp || 0;
  const maxXp = userData.max_xp || 100;
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
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  
  // Reset Nav Buttons
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  // Show Target
  document.getElementById(tabId).classList.add('active-page');
  
  // Activate Button
  if (navEl) navEl.classList.add('active');
  
  // Refresh Data logic
  if(tabId === 'tab-shop') loadShop();
};

// --- BATTLE SYSTEM ---

// 1. Start
window.startAdventure = async () => {
  if(userData.hp <= 0) { alert("You are too weak! Heal first."); return; }
  
  // Switch Views
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

  // Visual Animation
  const img = document.getElementById("monsterImage");
  img.style.transform = "scale(0.9) rotate(-5deg)";
  setTimeout(() => img.style.transform = "", 200);

  try {
    const res = await fetch('/api/battle', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'attack', userId: u.id, monsterId: currentBattle.monster.slug })
    });
    const result = await res.json();
    
    // Backend gives us calculated damage and new User HP
    // Frontend calculates Monster HP locally for smooth UI
    
    // Show Damage
    showDamage(result.dmg_dealt);
    
    // Update User HP
    userData.hp = result.user_hp;
    
    // Update Monster HP (Visual)
    // Assume currentBattle.monster has properties
    // If first hit, set currentHp = max_hp
    if(currentBattle.monster.currentHp === undefined) currentBattle.monster.currentHp = currentBattle.monster.max_hp || currentBattle.monster.hp;
    
    currentBattle.monster.currentHp -= result.dmg_dealt;
    
    if (currentBattle.monster.currentHp <= 0) {
       // --- WIN SCENARIO ---
       currentBattle.monster.currentHp = 0;
       updateBattleUI(); // Show 0 HP
       
       // Call Claim API
       const winRes = await fetch('/api/battle', {
           method: 'POST', headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({ action: 'claim_win', userId: u.id, monsterId: currentBattle.monster.slug })
       });
       const winData = await winRes.json();
       
       logBattle(`🏆 Victory! Found ${winData.gold || 0} Gold.`);
       
       setTimeout(() => {
           alert("Victory!");
           closeBattle();
           syncUser();
       }, 1000);
       
    } else {
        // Continue Battle
        logBattle(`You hit ${result.dmg_dealt}. Monster hit ${result.dmg_taken}.`);
        if(userData.hp <= 0) {
            logBattle("💀 You were defeated.");
            setTimeout(() => {
                alert("You died! HP Restored to 50%");
                closeBattle();
                syncUser();
            }, 1000);
        }
    }
    
    updateBattleUI();
    updateProfileUI(); // Update Header Gold/HP

  } catch(e) { console.error(e); }
};

// 3. Heal
window.usePotion = async () => {
  if(userData.gold < 10) { logBattle("Not enough gold (10g)!"); return; }
  
  const res = await fetch('/api/shop', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'heal', userId: u.id })
  });
  const data = await res.json();
  if(data.success) {
      userData.hp = data.hp;
      userData.gold = data.gold;
      updateProfileUI();
      logBattle("💚 HP Restored!");
  }
};

// 4. Flee
window.fleeBattle = () => {
  logBattle("🏃 Escaped!");
  setTimeout(closeBattle, 1000);
};

// Helper: Update UI
function updateBattleUI() {
  if(!currentBattle) return;
  const m = currentBattle.monster;
  
  document.getElementById("monsterName").innerText = m.name;
  document.getElementById("monsterLvl").innerText = m.lvl || m.level || 1;
  document.getElementById("monsterImage").src = m.image_url || m.img || "https://placehold.co/150";
  
  // Calc HP Percentage
  let max = m.max_hp || m.hp;
  let cur = (m.currentHp !== undefined) ? m.currentHp : max;
  
  const pct = Math.max(0, (cur / max) * 100);
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
  el.style.position = "absolute"; el.style.left="50%"; el.style.top="40%";
  el.style.color="white"; el.style.fontWeight="bold"; el.style.fontSize="2rem";
  el.style.textShadow="0 0 5px red"; el.style.transform="translate(-50%, -50%)";
  el.innerText = `-${amount}`;
  overlay.appendChild(el);
  
  // Simple animation via JS/CSS transition usually better, but removing after timeout works
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
        <div style="font-size:2rem">${item.icon || '⚔️'}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-price">💰 ${item.price}</div>
        <div style="font-size:0.7rem;color:#aaa">+${item.power} Power</div>
      </div>
    `).join('');
  } catch(e) {}
}

window.buyItem = async (slug) => {
  if(!confirm("Buy Item?")) return;
  const res = await fetch('/api/shop', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ action: 'buy', userId: u.id, itemSlug: slug })
  });
  const data = await res.json();
  if(data.success) { alert("Purchased!"); syncUser(); }
  else alert(data.error || "Failed");
};

// --- ADMIN FUNCTIONS ---
window.adminAddNewItem = async () => {
    const name = document.getElementById("newItemName").value;
    const slug = document.getElementById("newItemSlug").value;
    const price = document.getElementById("newItemPrice").value;
    const power = document.getElementById("newItemPower").value;
    const type = document.getElementById("newItemType").value;

    if(!name || !slug || !price) { alert("Fill fields"); return; }

    const res = await fetch('/api/admin', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            requester_id: u.id,
            action: 'add_item',
            data: { name, slug, price: Number(price), power: Number(power), type, stat: 'attack', icon: '⚔️' }
        })
    });
    const d = await res.json();
    if(d.success) alert("Item Added!"); else alert(d.error);
};

window.adminAddNewMonster = async () => {
    const name = document.getElementById("newMonName").value;
    const slug = document.getElementById("newMonSlug").value;
    const img = document.getElementById("newMonImg").value;
    const hp = document.getElementById("newMonHp").value;
    const atk = document.getElementById("newMonAtk").value;

    if(!name || !slug) return;

    const res = await fetch('/api/admin', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            requester_id: u.id,
            action: 'add_monster',
            data: { 
                name, slug, image_url: img, 
                hp: Number(hp), max_hp: Number(hp), attack: Number(atk),
                level: 10, reward_gold: 50, xp: 50
            }
        })
    });
    const d = await res.json();
    if(d.success) alert("Monster Added!"); else alert(d.error);
};
