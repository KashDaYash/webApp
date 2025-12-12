const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// --- CONFIGURATION ---
const root = document.documentElement;
let currentTheme = localStorage.getItem("theme") || "dark";
let customBg = localStorage.getItem("customBg");
let isGradient = localStorage.getItem("isGradient") === "true";

// Apply Settings Immediately
if (customBg) {
  applyCustomBg(customBg, isGradient);
} else {
  applyTheme(currentTheme);
}

// --- USER DATA ---
const u = tg.initDataUnsafe?.user;
// ➤ OWNER ID (Supreme Power)
const OWNER_ID = 1302298741; 

let currentChatId = null;
let chatPoll = null;
let discoverPage = 1;
let currentUserData = null;
let currentBattle = null;

// --- INITIALIZATION ---
window.onload = () => {
  const gate = document.getElementById("loginGate");
  const app = document.getElementById("app");
  const nav = document.getElementById("bottomNav");
  const loader = document.getElementById("loadingScreen");

  // 1. GATEWAY CHECK (Is user in Telegram?)
  if (!u || !u.id) {
    if(loader) loader.style.display = "none";
    if(gate) gate.classList.remove("hidden");
    if(app) app.classList.add("hidden");
    return;
  }

  // Show App
  if(gate) gate.classList.add("hidden");
  if(app) app.classList.remove("hidden");
  if(nav) nav.classList.remove("hidden");

  // 2. THEME LISTENERS
  const bgPicker = document.getElementById("bgPicker");
  const gradCheck = document.getElementById("gradientToggle");
  const colorPreview = document.getElementById("colorPreviewBox");
  
  if(bgPicker && customBg) {
    bgPicker.value = customBg;
    if(colorPreview) colorPreview.style.backgroundColor = customBg;
  }
  if(gradCheck) gradCheck.checked = isGradient;

  if(bgPicker) {
    bgPicker.addEventListener("input", (e) => {
      const color = e.target.value;
      const isGrad = document.getElementById("gradientToggle").checked;
      if(colorPreview) colorPreview.style.backgroundColor = color;
      applyCustomBg(color, isGrad);
      localStorage.setItem("customBg", color);
    });
  }
  if(gradCheck) {
    gradCheck.addEventListener("change", (e) => {
      const color = document.getElementById("bgPicker").value;
      applyCustomBg(color, e.target.checked);
      localStorage.setItem("isGradient", e.target.checked);
    });
  }

  // 3. START SYNC
  syncUserAndCheckPermissions();

  // 4. UI PRE-FILL
  if(document.getElementById("userName")) {
      document.getElementById("userName").textContent = u.first_name;
      document.getElementById("userHandle").textContent = u.username ? "@"+u.username : "—";
      document.getElementById("userId").textContent = u.id;
      if(u.photo_url) document.getElementById("userAvatar").src = u.photo_url;
  }

  setTimeout(() => { if(loader) loader.style.display = "none"; }, 500);
  loadRecentChats(); // Loads chat list initially
  
  // Event Listeners
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.msg')) removeContextMenu();
  });
};

// --- SYNC USER & CHECK PERMISSIONS ---
async function syncUserAndCheckPermissions() {
  try {
    const res = await fetch('/api/syncUser', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(u) 
    });
    currentUserData = await res.json();

    // Check Admin
    if (currentUserData.tg_id === OWNER_ID || currentUserData.is_admin) {
      injectAdminButton();
      const adminNavBtn = document.getElementById("navAdminBtn");
      if(adminNavBtn) adminNavBtn.style.display = "flex";
    }
    
    // Check Ban
    if (currentUserData.is_banned) {
      alert("🚫 You are BANNED from the Arena.");
      Telegram.WebApp.close();
    }

    updateProfileUI(); // Update Header & Stats
    loadShop(); // Pre-load shop

  } catch(e) { console.error("Sync Error", e); }
}

// --- UI UPDATER (Premium Data Mapping) ---
function updateProfileUI() {
  if(!currentUserData) return;
  
  // Header: Gold/Coins
  document.getElementById("userGold").innerText = currentUserData.coins || 0;
  
  // Profile Section
  // Use Character Name if assigned, else Telegram Name
  document.getElementById("heroName").innerText = currentUserData.character_name || currentUserData.first_name;
  document.getElementById("heroLevel").innerText = currentUserData.level || 1;
  
  // Character Image (Priority: Character Img > Photo URL > Placeholder)
  const charImg = currentUserData.character_image || currentUserData.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  document.getElementById("profileAvatar").src = charImg;

  // Stats
  const currentHp = currentUserData.hp !== undefined ? currentUserData.hp : 100;
  const maxHp = currentUserData.max_hp || 100;
  document.getElementById("heroHp").innerText = `${currentHp}/${maxHp}`;
  document.getElementById("heroEnergy").innerText = `${currentUserData.energy || 20}/20`;
  
  // Damage Display (Min - Max)
  const dMin = currentUserData.damage_min || 5;
  const dMax = currentUserData.damage_max || 10;
  document.getElementById("heroAttack").innerText = `${dMin}-${dMax}`;
  
  // XP Bar
  const xp = currentUserData.xp || 0;
  const maxXp = currentUserData.exp_max || 100;
  const xpPercent = Math.min(100, (xp / maxXp) * 100);
  document.getElementById("heroXpBar").style.width = `${xpPercent}%`;
  document.getElementById("xpText").innerText = `${xp}/${maxXp}`;

  // Inventory / Bag
  const invGrid = document.getElementById("inventoryList");
  if(currentUserData.inventory && currentUserData.inventory.length > 0) {
    invGrid.innerHTML = currentUserData.inventory.map(item => `
      <div class="item-card">
        <div style="font-size:2rem">${item.icon || '🎒'}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-price" style="font-size:0.7rem; color:#aaa">Owned</div>
      </div>
    `).join('');
  } else {
    // Show Character Quote if empty
    const quote = currentUserData.character_quote ? `"${currentUserData.character_quote}"` : "Empty Bag";
    invGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;opacity:0.6;font-style:italic;padding:10px">${quote}</div>`;
  }
}

// --- TAB NAVIGATION ---
window.switchTab = (tabId, navEl) => {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
  
  // Reset Nav Buttons
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  // Show Target
  document.getElementById(tabId).classList.add('active-page');
  
  // Activate Button
  if (navEl) navEl.classList.add('active');
  
  // Feature Specific Loads
  if(tabId === 'tab-shop') loadShop();
  if(tabId === 'tab-discover') loadDiscoverUsers(true);
};

// ==============================
// ⚔️ BATTLE SYSTEM (GAME ENGINE)
// ==============================

// 1. START ADVENTURE (Find Monster)
window.startAdventure = async () => {
  if(currentUserData.hp <= 0) { alert("💀 You are dead! Heal in Shop."); return; }
  
  // Switch to Battle View
  document.getElementById("arenaLobby").classList.add("hidden");
  document.getElementById("battleScreen").classList.remove("hidden");
  
  // Reset Log & UI
  document.getElementById("battleLog").innerHTML = `<div class="log-entry">🔍 Searching for enemy...</div>`;
  
  try {
    const res = await fetch(`/api/battle?action=start&id=${u.id}`);
    const data = await res.json();
    
    currentBattle = data;
    updateBattleUI();
    logBattle(`⚔️ A wild **${data.monster.name}** appeared!`);
    if(data.monster.quote) logBattle(`<i>"${data.monster.quote}"</i>`);
    
  } catch(e) { logBattle("❌ Error finding monster."); }
};

// 2. ATTACK LOGIC (Turn Based)
window.performAttack = async () => {
  if(!currentBattle || (currentBattle.monster.currentHp !== undefined && currentBattle.monster.currentHp <= 0)) return;

  // Animation: Hit Effect
  const img = document.getElementById("monsterImage");
  img.style.transform = "scale(0.9) rotate(-5deg)";
  setTimeout(() => img.style.transform = "", 200);

  try {
    const res = await fetch('/api/battle', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'attack', userId: u.id, monsterId: currentBattle.monster.slug })
    });
    const result = await res.json();
    
    // --- UPDATE STATE ---
    
    // 1. Show Damage
    showDamage(result.dmg_dealt);
    
    // 2. Update User HP Locally
    currentUserData.hp = result.user_hp;
    
    // 3. Update Monster HP Locally
    // Initialize currentHp if missing
    if(currentBattle.monster.currentHp === undefined) {
        currentBattle.monster.currentHp = currentBattle.monster.max_hp || currentBattle.monster.hp;
    }
    currentBattle.monster.currentHp -= result.dmg_dealt;
    
    // --- CHECK WIN/LOSS ---
    
    if (currentBattle.monster.currentHp <= 0) {
       // WINNER!
       currentBattle.monster.currentHp = 0;
       updateBattleUI();
       
       // Claim Reward
       const winRes = await fetch('/api/battle', {
           method: 'POST', headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({ action: 'claim_win', userId: u.id, monsterId: currentBattle.monster.slug })
       });
       const winData = await winRes.json();
       
       logBattle(`🏆 <b>VICTORY!</b>`);
       logBattle(`💰 +${winData.coins} Coins | ⭐ +${winData.xp} XP`);
       
       if(winData.levelUp) {
           alert("🎉 LEVEL UP!");
       }
       
       setTimeout(() => {
           closeBattle();
           syncUser(); // Refresh stats
       }, 1500);
       
    } else {
        // BATTLE CONTINUES
        logBattle(`💥 You hit <b>${result.dmg_dealt}</b> dmg.`);
        if(result.dmg_taken > 0) {
            logBattle(`💔 ${result.monster_name} hit you for <b>${result.dmg_taken}</b> dmg.`);
        } else {
            logBattle(`🛡️ You blocked the attack!`);
        }

        // Check if User Died
        if(currentUserData.hp <= 0) {
            logBattle("💀 You were defeated...");
            setTimeout(() => {
                alert("You died! HP Restored to 50%");
                closeBattle();
                syncUser();
            }, 1000);
        }
    }
    
    updateBattleUI();
    updateProfileUI(); // Update Header HP/Coins

  } catch(e) { console.error(e); }
};

// 3. HEAL (Potion)
window.usePotion = async () => {
  if(currentUserData.coins < 10) { logBattle("💸 Not enough coins (10g)!"); return; }
  
  const res = await fetch('/api/shop', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'buy', userId: u.id, itemSlug: 'potion' }) // Assuming generic potion logic or shop logic
  });
  // Note: Using shop API for potion might be better if potion is in shop items list
  // Let's assume shop.js handles 'buy' with immediate effect
  const data = await res.json();
  
  if(data.success) {
      currentUserData.hp = data.hp;
      currentUserData.coins = data.coins;
      updateProfileUI();
      logBattle("🧪 You drank a potion. HP Restored!");
  } else {
      logBattle(data.error || "Cannot heal right now.");
  }
};

// 4. FLEE
window.fleeBattle = () => {
  logBattle("🏃 You ran away cowardly!");
  setTimeout(closeBattle, 1000);
};

// --- BATTLE HELPER FUNCTIONS ---
function updateBattleUI() {
  if(!currentBattle) return;
  const m = currentBattle.monster;
  
  document.getElementById("monsterName").innerText = m.name;
  document.getElementById("monsterLvl").innerText = m.lvl || 1;
  document.getElementById("monsterImage").src = m.image_url || m.img || "https://placehold.co/150";
  
  // Calculate Bar Width
  let max = m.max_hp || m.hp;
  let cur = (m.currentHp !== undefined) ? m.currentHp : max;
  const pct = Math.max(0, (cur / max) * 100);
  
  const bar = document.getElementById("monsterHpBar");
  bar.style.width = `${pct}%`;
  
  // Color change on low HP
  if(pct < 30) bar.style.background = "#ef4444"; // Red
  else if(pct < 60) bar.style.background = "#f59e0b"; // Orange
  else bar.style.background = "#10b981"; // Green
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
  el.style.transform="translate(-50%, -50%)";
  el.style.color="white"; el.style.fontWeight="bold"; el.style.fontSize="2.5rem";
  el.style.textShadow="0 0 10px #ef4444"; el.style.pointerEvents="none";
  el.style.zIndex="20";
  el.innerText = `-${amount}`;
  
  overlay.appendChild(el);
  
  // Animate & Remove
  el.animate([
    { opacity: 1, transform: "translate(-50%, -50%) scale(0.5)" },
    { opacity: 0, transform: "translate(-50%, -150%) scale(1.2)" }
  ], { duration: 800, easing: "ease-out" });

  setTimeout(() => el.remove(), 800);
}

// ==============================
// 🛒 SHOP SYSTEM
// ==============================

async function loadShop() {
  const grid = document.getElementById("shopList");
  try {
    const res = await fetch('/api/shop?type=list');
    const items = await res.json();
    
    grid.innerHTML = items.map(item => `
      <div class="item-card" onclick="buyItem('${item.slug}')">
        <div style="font-size:2.5rem; margin-bottom:5px">${item.icon || '🛍️'}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-price">💰 ${item.price}</div>
        <div style="font-size:0.7rem; color:#aaa; margin-top:2px">+${item.hp || item.power || 0} Effect</div>
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
  
  if(data.success) {
      alert(data.msg || "Purchased!");
      syncUser(); // Refresh coins/hp
  } else {
      alert(data.error || "Failed");
  }
};

// ==============================
// 🌍 DISCOVER / LEADERBOARD
// ==============================

window.loadDiscoverUsers = async (reset = false) => {
  const grid = document.getElementById("discoverGrid");
  const btnContainer = document.getElementById("loadMoreContainer");
  
  if(reset) {
    discoverPage = 1;
    grid.innerHTML = "";
    btnContainer.classList.add("hidden");
  }

  try {
    const res = await fetch(`/api/search?query=&page=${discoverPage}&myId=${u.id}`);
    const users = await res.json();

    if (!users || users.length === 0) {
      if(discoverPage === 1) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;opacity:0.5;padding:20px">No users found</div>`;
      btnContainer.classList.add("hidden");
      return;
    }

    const html = users.map(user => `
      <div class="grid-user-card" onclick="alert('Profile view coming soon!')">
        <img src="${user.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" loading="lazy">
        <div class="grid-name">
          ${user.first_name} 
          ${user.is_verified ? '<span class="material-icons-round verified-badge" style="font-size:0.8rem">verified</span>' : ''}
        </div>
        <div style="font-size:0.7rem; color:#f59e0b">Lvl ${user.level || 1}</div>
      </div>
    `).join('');

    grid.insertAdjacentHTML('beforeend', html);

    if (users.length === 10) btnContainer.classList.remove("hidden");
    else btnContainer.classList.add("hidden");

  } catch(e) { console.error("Discover Error", e); }
};

window.loadMoreUsers = () => {
  discoverPage++;
  loadDiscoverUsers(false);
};

// ==============================
// 👑 ADMIN PANEL
// ==============================

function injectAdminButton() {
  // Logic mostly handled in HTML via ID toggling
  // This function can handle extra admin initializations
}

// Add Item
window.adminAddNewItem = async () => {
    const name = document.getElementById("newItemName").value;
    const slug = document.getElementById("newItemSlug").value;
    const price = document.getElementById("newItemPrice").value;
    const power = document.getElementById("newItemPower").value;
    const type = document.getElementById("newItemType").value;

    if(!name || !slug || !price) { alert("Fill all fields"); return; }

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

// Add Monster
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
                level: 10, reward_gold: 50
            }
        })
    });
    const d = await res.json();
    if(d.success) alert("Monster Added!"); else alert(d.error);
};

// ==============================
// 🎨 THEME & UTILS
// ==============================

window.resetThemeToDefault = () => {
  localStorage.removeItem("customBg");
  localStorage.removeItem("isGradient");
  root.style.background = "";
  applyTheme(currentTheme);
  document.getElementById("bgPicker").value = "#0f0f0f";
  document.getElementById("gradientToggle").checked = false;
  alert("Theme Reset!");
};

function applyCustomBg(color, gradient) {
  if (gradient) root.style.background = `linear-gradient(135deg, ${color} 0%, #000000 100%)`;
  else root.style.background = color;
  root.style.setProperty('--bg', color);
}

function applyTheme(t) {
  // Logic if needed for light/dark specific overrides
  if(t === 'light') root.classList.add('light-theme');
  else root.classList.remove('light-theme');
}

// Recent chats loader (Placeholder if needed for old features or removed)
async function loadRecentChats() {
    // Kept empty to prevent errors if HTML still calls it, 
    // or you can implement chat logic here if needed.
}
