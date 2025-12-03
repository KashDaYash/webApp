// Command: profile.js
const tg = window.Telegram.WebApp;

// 1. Initialize
tg.ready(); 
tg.expand(); 
tg.enableVerticalSwipes();
try { tg.requestFullscreen(); } catch(e){}

// Set Colors
tg.setHeaderColor("#1c1c1c"); 
tg.setBackgroundColor("#1e1e1e"); 
tg.setBottomBarColor("#000000");

// --- CONFIG ---
const VERCEL_BASE_URL = "https://webapp-seven-lilac.vercel.app/api";

// --- LOCALIZATION ---
const localization = {
  en: {
    title: "Your Profile", premium: "💸 Premium", id: "ID:", username: "Username:",
    options: "Options", settings: "⚙ Settings", messages: "📩 Messages",
    language: "🌐 Language", theme: "🎨 Theme",
    close: "✦ Close Profile ✦", copied: "Copied!",
    language_question: "Select Language:", language_current: "Language changed to English 🇬🇧",
    chats_title: "Chats", not_available: "Not Available", user_not_found: "User Not Found",
    reset_confirm: "Are you sure you want to reset the theme?", reset_success: "Theme Reset!",
    no_chats: "No conversations found.", loading_chats: "Loading chats..."
  },
  hi: {
    title: "आपकी प्रोफाइल", premium: "💸 प्रीमियम", id: "आईडी:", username: "यूज़रनेम:",
    options: "विकल्प", settings: "⚙ सेटिंग्स", messages: "📩 संदेश",
    language: "🌐 भाषा", theme: "🎨 थीम",
    close: "✦ प्रोफाइल बंद करें ✦", copied: "कॉपी किया गया!",
    language_question: "भाषा चुनें:", language_current: "भाषा हिंदी में बदल दी गई है 🇮🇳",
    chats_title: "चैट्स", not_available: "उपलब्ध नहीं", user_not_found: "उपयोगकर्ता नहीं मिला",
    reset_confirm: "क्या आप थीम रिसेट करना चाहते हैं?", reset_success: "थीम रिसेट हो गई!",
    no_chats: "कोई संदेश नहीं मिला", loading_chats: "चैट लोड हो रही हैं..."
  }
};

// --- THEME LOGIC ---
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");
let theme = localStorage.getItem("theme") || tg.colorScheme || "dark";

function applyCustomColor(hexColor) {
  if (!/^#([0-9A-F]{3}){1,2}$/i.test(hexColor)) { tg.showAlert("Invalid Hex Code!"); return; }
  root.style.setProperty('--accent', hexColor);
  const r = parseInt(hexColor.slice(1, 3), 16), g = parseInt(hexColor.slice(3, 5), 16), b = parseInt(hexColor.slice(5, 7), 16);
  root.style.setProperty('--glow', `rgba(${r}, ${g}, ${b}, 0.45)`);
  localStorage.setItem("customAccentColor", hexColor);
}

function applyTheme(name){
  const customColor = localStorage.getItem("customAccentColor");
  if (customColor) applyCustomColor(customColor);
  else { root.style.removeProperty('--accent'); root.style.removeProperty('--glow'); }
  
  if(name==="light"){ 
      root.classList.add("light-theme"); toggle.textContent="☀️"; 
      tg.setHeaderColor("#ffffff"); tg.setBackgroundColor("#f5f5f5");
  } else { 
      root.classList.remove("light-theme"); toggle.textContent="🌙"; 
      tg.setHeaderColor("#1c1c1c"); tg.setBackgroundColor("#1e1e1e");
  }
}
applyTheme(theme);

toggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  toggle.classList.add("animate");
  toggle.addEventListener("animationend",()=>toggle.classList.remove("animate"),{once:true});
  applyTheme(theme);
});


// --- USER DATA (Clean One-Liner Logic) ---
// Yahan humne wahi logic use kiya jo aapne bola 👇
const user = tg.initDataUnsafe?.user || {};

// Language detect logic
let langCode = localStorage.getItem("languageCode");
if (!langCode) {
    // Agar saved nahi hai, to Telegram ki language use karein, ya default 'en'
    langCode = (user.language_code || "en").split("-")[0];
}
if (!localization[langCode]) langCode = "en";


function renderProfile() {
    const lang = localization[langCode];
    
    // Text Updates
    document.title = lang.title;
    document.querySelector('.profile-body .info:nth-child(1) strong').textContent = lang.id;
    document.querySelector('.profile-body .info:nth-child(2) strong').textContent = lang.username;
    document.querySelector('.menu-header h3').textContent = lang.options;
    
    const mb = document.getElementById("menuBody");
    mb.children[0].textContent = lang.settings;
    mb.children[1].textContent = lang.messages;
    mb.children[2].textContent = lang.language;
    mb.children[3].textContent = lang.theme;    
    
    document.querySelector('.chat-header h3').textContent = lang.chats_title;

    // Data Filling
    const realName = [user.first_name, user.last_name].filter(Boolean).join(" ");
    
    document.getElementById("userName").textContent = realName || lang.user_not_found;
    document.getElementById("userId").textContent = user.id || lang.not_available;
    document.getElementById("userHandle").textContent = user.username ? "@"+user.username : lang.not_available;
    document.getElementById("userAvatar").src = user.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    // Premium Check
    const premTag = document.getElementById("userPremium");
    if(user.is_premium) {
        premTag.innerHTML = lang.premium;
        premTag.classList.remove("hidden");
    } else {
        premTag.classList.add("hidden");
    }

    // Lang Display
    const langMap = { en:"🇬🇧 English", ru:"🇷🇺 Русский", hi:"🇮🇳 हिन्दी", es:"🇪🇸 Español", de:"🇩🇪 Deutsch" };
    document.getElementById("userLanguage").textContent = langMap[langCode] || langCode.toUpperCase();
}

renderProfile(); // Initial Render

// Lottie
lottie.loadAnimation({
  container: document.getElementById("lottie"), renderer: "svg", loop: true, autoplay: true,
  path: "https://assets2.lottiefiles.com/packages/lf20_jv4xehxh.json"
});

// Copy Logic
document.querySelectorAll(".copyable").forEach(el=>{
  const span = el.querySelector("span");
  el.addEventListener("click",()=>{
    const text = span.textContent.trim();
    const lang = localization[langCode];
    if (text === lang.not_available || text === "—") {
         tg.HapticFeedback.notificationOccurred('error'); return; 
    }
    navigator.clipboard.writeText(text);
    const tt=document.createElement("div"); tt.className="tooltip"; tt.textContent=lang.copied;
    el.appendChild(tt);
    requestAnimationFrame(()=>tt.style.opacity=1);
    setTimeout(()=>{ tt.style.opacity=0; setTimeout(()=>tt.remove(),200); },1000);
  });
});

// --- LOADER ---
function startLoader() {
    let prog = 0;
    const bar = document.getElementById("progressBar");
    const txt = document.getElementById("progressText");
    const interval = setInterval(()=>{
        prog += 2; 
        bar.style.width = prog + "%"; txt.textContent = prog + "%";
        if(prog >= 100){
            clearInterval(interval);
            document.getElementById("loadingScreen").style.opacity="0";
            setTimeout(()=>{
                document.getElementById("loadingScreen").style.display="none";
                document.getElementById("mainContainer").style.display="flex"; 
                document.querySelector(".container").style.display="flex"; 
                const lang = localization[langCode];
                tg.MainButton.setText(lang.close).setParams({has_shine_effect:true}).show().onClick(()=>tg.close());
            },300);
        }
    }, 15);
}
startLoader();

// --- MENU ACTIONS ---
const menuToggle=document.getElementById("menuToggle");
const menuBody=document.getElementById("menuBody");
const menuItems = document.querySelectorAll(".menu-item");

menuToggle.addEventListener("click",()=>{
  const open = menuBody.style.display==="flex";
  menuBody.style.display = open ? "none" : "flex";
  menuToggle.classList.toggle("rotated", !open);
});

menuItems.forEach(item => { item.addEventListener("click", handleMenuItemClick); });

function handleMenuItemClick(event) {
    const itemText = event.currentTarget.textContent.trim();
    tg.HapticFeedback.impactOccurred('light');
    
    menuBody.style.display = "none";
    menuToggle.classList.remove("rotated");
    
    const lang = localization[langCode];

    if (itemText.includes(lang.language)) {
        tg.showPopup({
            title: lang.language_question, message: "Select Interface Language:",
            buttons: [ 
                { id: 'en', text: '🇬🇧 English', type: 'default' }, 
                { id: 'hi', text: '🇮🇳 हिन्दी', type: 'default' }, 
                { id: 'cancel', text: 'Cancel', type: 'cancel' } 
            ]
        }, (btnId) => {
            if (btnId === 'en' || btnId === 'hi') {
                langCode = btnId;
                localStorage.setItem("languageCode", btnId);
                renderProfile();
                tg.showAlert(localization[langCode].language_current);
            }
        });
    } 
    else if (itemText.includes(lang.theme)) {
        const initialColor = localStorage.getItem("customAccentColor") || "#839ef0";
        colorInput.value = initialColor; hexDisplay.value = initialColor.toUpperCase();
        colorOverlay.classList.remove("hidden");
    }
    else if (itemText.includes(lang.messages)) { 
        showChatInterface();
    }
    else if (itemText.includes(lang.settings)) {
         tg.showAlert("Settings not available yet.");
    }
}

// --- CHAT INTERFACE & API ---
const chatContainer = document.getElementById("chatContainer");
const backToProfileBtn = document.getElementById("backToProfileBtn");
const chatList = document.getElementById("chatList");
const chatSearchInput = document.getElementById("chatSearchInput");

function showChatInterface() {
    chatContainer.classList.remove("hidden");
    document.getElementById("mainContainer").classList.add("hidden"); 
    tg.BackButton.show(); 
    fetchChats(); 
}

function hideChatInterface() {
    chatContainer.classList.add("hidden");
    document.getElementById("mainContainer").classList.remove("hidden"); 
    tg.BackButton.hide();
}

tg.BackButton.onClick(hideChatInterface);
backToProfileBtn.addEventListener("click", hideChatInterface);

async function fetchChats() {
    const lang = localization[langCode];
    chatList.innerHTML = `<div class="loading-chats">${lang.loading_chats}</div>`;

    try {
        const userId = user.id || 0;
        const res = await fetch(`${VERCEL_BASE_URL}/get-chats?user_id=${userId}`);
        const data = await res.json();

        chatList.innerHTML = ''; 

        if (data.success && data.data.length > 0) {
            renderChatList(data.data);
        } else {
            showNoChatsMessage();
        }
    } catch (e) {
        showNoChatsMessage();
    }
}

function renderChatList(chats) {
    chats.forEach(chat => {
        const el = document.createElement("div");
        el.className = "chat-item";
        el.setAttribute("data-name", chat.participant_name.toLowerCase()); 
        el.innerHTML = `
            <img src="${chat.avatar}" class="chat-avatar">
            <div class="chat-info">
                <div class="chat-name">${chat.participant_name}</div>
                <div class="chat-last-msg">${chat.last_message}</div>
            </div>
            <div class="chat-meta">
                <span>${chat.time}</span>
                ${chat.unread_count > 0 ? `<div class="unread-badge">${chat.unread_count}</div>` : ''}
            </div>
        `;
        el.addEventListener("click", () => tg.showAlert("Opening chat..."));
        chatList.appendChild(el);
    });
}

function showNoChatsMessage() {
    const lang = localization[langCode];
    const empty = document.createElement("div");
    empty.className = "loading-chats";
    empty.textContent = lang.no_chats;
    chatList.appendChild(empty);
}

// Search Logic
chatSearchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const items = document.querySelectorAll(".chat-item");
    let visibleCount = 0;
    
    items.forEach(item => {
        const name = item.getAttribute("data-name");
        if (name.includes(term)) {
            item.style.display = "flex";
            visibleCount++;
        } else {
            item.style.display = "none";
        }
    });
});


// --- COLOR PICKER ---
const colorOverlay = document.getElementById("colorPickerOverlay");
const colorInput = document.getElementById("colorPickerInput");
const hexDisplay = document.getElementById("hexInputDisplay");
const setColorBtn = document.getElementById("setColorBtn");
const resetColorBtn = document.getElementById("resetColorBtn");
const cancelColorBtn = document.getElementById("cancelColorBtn");

colorInput.addEventListener('input', () => hexDisplay.value = colorInput.value.toUpperCase());
hexDisplay.addEventListener('input', () => { if (/^#([0-9A-F]{3}){1,2}$/i.test(hexDisplay.value)) colorInput.value = hexDisplay.value; });

function hideColorPicker() { colorOverlay.classList.add("hidden"); }

setColorBtn.addEventListener("click", () => { 
    applyCustomColor(colorInput.value); 
    hideColorPicker(); 
});

resetColorBtn.addEventListener("click", () => { 
    const lang = localization[langCode];
    tg.showConfirm(lang.reset_confirm, (confirmed) => {
        if (confirmed) {
            localStorage.removeItem("customAccentColor"); 
            applyTheme(theme); 
            tg.showAlert(lang.reset_success); 
            hideColorPicker(); 
        }
    });
});

cancelColorBtn.addEventListener("click", hideColorPicker);
