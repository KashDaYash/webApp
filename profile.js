// Command: profile.js
const tg = window.Telegram.WebApp;
tg.ready(); tg.expand(); tg.enableVerticalSwipes();
try { tg.requestFullscreen(); } catch(e){}

tg.setHeaderColor("#1c1c1c"); tg.setBackgroundColor("#1e1e1e"); tg.setBottomBarColor("#000000");

// --- CONFIG ---
const VERCEL_BASE_URL = "https://webapp-seven-lilac.vercel.app"; // Ensure this matches your Vercel URL

// --- LOCALIZATION ---
const localization = {
  en: {
    title: "Your Profile", premium: "💸 Premium", id: "ID:", username: "Username:",
    options: "Options", settings: "⚙ Settings", messages: "📩 Messages",
    language: "🌐 Language", subscription: "💱 Subscription", theme: "🎨 Theme",
    close: "✦ Close Profile ✦", copied: "Copied!",
    language_question: "Select Language:", language_current_en: "Interface Language changed to English.",
    language_current_hi: "Interface Language changed to Hindi.", chats_title: "Chats"
  },
  hi: {
    title: "आपकी प्रोफाइल", premium: "💸 प्रीमियम", id: "आईडी:", username: "यूज़रनेम:",
    options: "विकल्प", settings: "⚙ सेटिंग्स", messages: "📩 संदेश",
    language: "🌐 भाषा", subscription: "💱 सदस्यता", theme: "🎨 थीम",
    close: "✦ प्रोफाइल बंद करें ✦", copied: "कॉपी किया गया!",
    language_question: "भाषा चुनें:", language_current_en: "इंटरफ़ेस भाषा अंग्रेजी में बदल दी गई है।",
    language_current_hi: "इंटरफ़ेस भाषा हिंदी में बदल दी गई है।", chats_title: "चैट्स"
  }
};

// --- THEME & COLOR LOGIC ---
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");
let theme = localStorage.getItem("theme") || tg.colorScheme || "dark";

function applyCustomColor(hexColor) {
  if (!/^#([0-9A-F]{3}){1,2}$/i.test(hexColor)) { tg.showAlert("Invalid Hex Code!"); return; }
  root.style.setProperty('--accent', hexColor);
  const r = parseInt(hexColor.slice(1, 3), 16), g = parseInt(hexColor.slice(3, 5), 16), b = parseInt(hexColor.slice(5, 7), 16);
  root.style.setProperty('--glow', `rgba(${r}, ${g}, ${b}, 0.45)`);
  localStorage.setItem("customAccentColor", hexColor);
  tg.showAlert("Theme color successfully updated! 🎨");
}

function applyTheme(name){
  const customColor = localStorage.getItem("customAccentColor");
  if (customColor) {
    root.style.setProperty('--accent', customColor);
    const r = parseInt(customColor.slice(1, 3), 16), g = parseInt(customColor.slice(3, 5), 16), b = parseInt(customColor.slice(5, 7), 16);
    root.style.setProperty('--glow', `rgba(${r}, ${g}, ${b}, 0.45)`);
  } else {
    root.style.removeProperty('--accent'); root.style.removeProperty('--glow');
  }
  if(name==="light"){ root.classList.add("light-theme"); toggle.textContent="☀️"; } 
  else { root.classList.remove("light-theme"); toggle.textContent="🌙"; }
}
applyTheme(theme);

toggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  toggle.classList.add("animate");
  toggle.addEventListener("animationend",()=>toggle.classList.remove("animate"),{once:true});
  applyTheme(theme);
});

// --- USER DATA & INTERFACE ---
const u = tg.initDataUnsafe?.user || {};
let code = (u.language_code || "en").split("-")[0];

function updateInterfaceText(langCode) {
    const lang = localization[langCode] || localization.en;
    document.title = lang.title;
    document.querySelector('.profile-body .info:nth-child(1) strong').textContent = lang.id;
    document.querySelector('.profile-body .info:nth-child(2) strong').textContent = lang.username;
    document.querySelector('.menu-header h3').textContent = lang.options;
    const mb = document.getElementById("menuBody");
    mb.children[0].textContent = lang.settings; mb.children[1].textContent = lang.messages;
    mb.children[2].textContent = lang.language; mb.children[3].textContent = lang.subscription;
    mb.children[4].textContent = lang.theme;
    
    // Chat Header Title
    document.querySelector('.chat-header h3').textContent = lang.chats_title || "Chats";

    if (u.is_premium) document.getElementById("userPremium").innerHTML = lang.premium;
    const langMap = { en:"🇬🇧 English", ru:"🇷🇺 Русский", hi:"🇮🇳 हिन्दी", es:"🇪🇸 Español", de:"🇩🇪 Deutsch" };
    document.getElementById("userLanguage").textContent = langMap[langCode] || langCode.toUpperCase();
}

document.getElementById("userAvatar").src = u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
document.getElementById("userName").textContent = [u.first_name, u.last_name].filter(Boolean).join(" ") || "Guest";
if(u.is_premium) document.getElementById("userPremium").classList.remove("hidden");
document.getElementById("userHandle").textContent = u.username ? "@"+u.username : "—";
document.getElementById("userId").textContent = u.id || "—";
updateInterfaceText(code);

lottie.loadAnimation({
  container: document.getElementById("lottie"), renderer: "svg", loop: true, autoplay: true,
  path: "https://assets2.lottiefiles.com/packages/lf20_jv4xehxh.json"
});

document.querySelectorAll(".copyable").forEach(el=>{
  const span = el.querySelector("span");
  el.addEventListener("click",()=>{
    navigator.clipboard.writeText(span.textContent.trim());
    const tt=document.createElement("div"); tt.className="tooltip"; tt.textContent=localization[code].copied;
    el.appendChild(tt);
    requestAnimationFrame(()=>tt.style.opacity=1);
    setTimeout(()=>{ tt.style.opacity=0; setTimeout(()=>tt.remove(),200); },1000);
  });
});

// --- VERIFICATION & LOADER ---
const initData = tg.initData; 
let IS_USER_VERIFIED = false;

function startLoaderInterval() {
    let prog = 0;
    const bar = document.getElementById("progressBar");
    const txt = document.getElementById("progressText");
    const interval = setInterval(()=>{
        prog += 1; bar.style.width = prog + "%"; txt.textContent = prog + "%";
        if(prog >= 100){
            clearInterval(interval);
            document.getElementById("loadingScreen").style.opacity="0";
            setTimeout(()=>{
                document.getElementById("loadingScreen").style.display="none";
                document.getElementById("mainContainer").style.display="flex"; // Changed from block to flex
                document.querySelector(".container").style.display="block";
                tg.MainButton.setText(localization[code].close).setParams({has_shine_effect:true}).show().onClick(()=>tg.close());
            },300);
        }
    }, 18);
}

async function verifyUserAndStartApp() {
    try {
        // NOTE: For debugging, if verification fails, check console logs.
        const response = await fetch(`${VERCEL_BASE_URL}/auth/verify`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: initData })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            IS_USER_VERIFIED = true;
            console.log("Verified:", data.user_id);
            startLoaderInterval(); 
        } else {
            // Fallback for development if needed, or show error
            tg.showAlert("Verification Failed: " + (data.message || "Unknown error"));
            tg.close();
        }
    } catch (error) {
        tg.showAlert("Network Error. Please check your VERCEL_BASE_URL.");
        tg.close();
    }
}
verifyUserAndStartApp();

// --- MENU & NAVIGATION ---
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
    
    // LANGUAGE
    if (itemText.includes(localization[code].language)) {
        tg.showPopup({
            title: localization[code].language_question,
            message: "Choose your interface language:",
            buttons: [ { id: 'en', text: '🇬🇧 English', type: 'default' }, { id: 'hi', text: '🇮🇳 हिन्दी', type: 'default' }, { id: 'cancel', text: 'Cancel', type: 'cancel' } ]
        }, (btn) => {
            if (btn === 'en' || btn === 'hi') {
                code = btn; localStorage.setItem("languageCode", btn);
                updateInterfaceText(code);
                tg.showAlert(localization[code][btn === 'en' ? 'language_current_en' : 'language_current_hi']);
            }
        });
    } 
    // THEME
    else if (itemText.includes(localization[code].theme)) {
        const initialColor = localStorage.getItem("customAccentColor") || "#839ef0";
        colorInput.value = initialColor; hexDisplay.value = initialColor.toUpperCase();
        colorOverlay.classList.remove("hidden");
    }
    // MESSAGES (Chat UI)
    else if (itemText.includes(localization[code].messages)) { 
        showChatInterface();
    }
    // OTHERS
    else {
        tg.showAlert("Feature coming soon!");
    }
}

// --- CHAT INTERFACE LOGIC ---
const chatContainer = document.getElementById("chatContainer");
const backToProfileBtn = document.getElementById("backToProfileBtn");
const chatList = document.getElementById("chatList");

function showChatInterface() {
    chatContainer.classList.remove("hidden");
    document.getElementById("mainContainer").classList.add("hidden"); // Hide profile
    tg.BackButton.show(); // Show Telegram Back Button
    
    // Fetch Chats
    loadChats();
}

function hideChatInterface() {
    chatContainer.classList.add("hidden");
    document.getElementById("mainContainer").classList.remove("hidden"); // Show profile
    tg.BackButton.hide();
}

tg.BackButton.onClick(hideChatInterface);
backToProfileBtn.addEventListener("click", hideChatInterface);

async function loadChats() {
    chatList.innerHTML = '<div class="loading-chats">Loading...</div>';
    try {
        // Backend se chats fetch karein
        const res = await fetch(`${VERCEL_BASE_URL}/get-chats?user_id=${u.id || 0}`);
        const data = await res.json();
        
        chatList.innerHTML = ''; // Clear loader
        
        if (data.success && data.data.length > 0) {
            data.data.forEach(chat => {
                const el = document.createElement("div");
                el.className = "chat-item";
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
                // Click logic for later
                el.addEventListener("click", () => tg.showAlert(`Opening chat with ${chat.participant_name}...`));
                chatList.appendChild(el);
            });
        } else {
            chatList.innerHTML = '<div class="loading-chats">No messages yet.</div>';
        }
    } catch (e) {
        chatList.innerHTML = '<div class="loading-chats">Failed to load chats.</div>';
    }
}


/* --- Color Picker Actions --- */
const colorOverlay = document.getElementById("colorPickerOverlay");
const colorInput = document.getElementById("colorPickerInput");
const hexDisplay = document.getElementById("hexInputDisplay");
const setColorBtn = document.getElementById("setColorBtn");
const resetColorBtn = document.getElementById("resetColorBtn");
const cancelColorBtn = document.getElementById("cancelColorBtn");

colorInput.addEventListener('input', () => hexDisplay.value = colorInput.value.toUpperCase());
hexDisplay.addEventListener('input', () => { if (/^#([0-9A-F]{3}){1,2}$/i.test(hexDisplay.value)) colorInput.value = hexDisplay.value; });
function hideColorPicker() { colorOverlay.classList.add("hidden"); }

setColorBtn.addEventListener("click", () => { applyCustomColor(colorInput.value); hideColorPicker(); });
resetColorBtn.addEventListener("click", () => { localStorage.removeItem("customAccentColor"); applyTheme(theme); tg.showAlert("Reset!"); hideColorPicker(); });
cancelColorBtn.addEventListener("click", hideColorPicker);
