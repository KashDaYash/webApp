// Command: profile.js
const tg = window.Telegram.WebApp;
tg.ready(); tg.expand(); tg.enableVerticalSwipes();
try { tg.requestFullscreen(); } catch(e){}

tg.setHeaderColor("#1c1c1c"); tg.setBackgroundColor("#1e1e1e"); tg.setBottomBarColor("#000000");

// --- CONFIG ---
const VERCEL_BASE_URL = "https://webapp-seven-lilac.vercel.app/api"; 

// --- LOCALIZATION ---
const localization = {
  en: {
    title: "Your Profile", premium: "💸 Premium", id: "ID:", username: "Username:",
    options: "Options", settings: "⚙ Settings", messages: "📩 Messages",
    language: "🌐 Language", theme: "🎨 Theme",
    close: "✦ Close Profile ✦", copied: "Copied!",
    language_question: "Select Language:", language_current_en: "Interface Language changed to English.",
    language_current_hi: "Interface Language changed to Hindi.", chats_title: "Chats",
    not_available: "Not Available", user_not_found: "User Not Found", guest: "Guest User"
  },
  hi: {
    title: "आपकी प्रोफाइल", premium: "💸 प्रीमियम", id: "आईडी:", username: "यूज़रनेम:",
    options: "विकल्प", settings: "⚙ सेटिंग्स", messages: "📩 संदेश",
    language: "🌐 भाषा", theme: "🎨 थीम",
    close: "✦ प्रोफाइल बंद करें ✦", copied: "कॉपी किया गया!",
    language_question: "भाषा चुनें:", language_current_en: "इंटरफ़ेस भाषा अंग्रेजी में बदल दी गई है।",
    language_current_hi: "इंटरफ़ेस भाषा हिंदी में बदल दी गई है।", chats_title: "चैट्स",
    not_available: "उपलब्ध नहीं", user_not_found: "उपयोगकर्ता नहीं मिला", guest: "अतिथि उपयोगकर्ता"
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
  tg.showAlert("Theme updated!");
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

// --- USER DATA (STRICT: NO FAKE DATA) ---
// Agar data nahi hai (Browser me), to undefined rahega. Hum nakli data nahi banayenge.
const u = tg.initDataUnsafe?.user || {}; 

let code = (u.language_code || "en").split("-")[0];

function updateInterfaceText(langCode) {
    const lang = localization[langCode] || localization.en;
    document.title = lang.title;
    
    // Labels
    document.querySelector('.profile-body .info:nth-child(1) strong').textContent = lang.id;
    document.querySelector('.profile-body .info:nth-child(2) strong').textContent = lang.username;
    
    document.querySelector('.menu-header h3').textContent = lang.options;
    
    const mb = document.getElementById("menuBody");
    mb.children[0].textContent = lang.settings;
    mb.children[1].textContent = lang.messages;
    mb.children[2].textContent = lang.language;
    mb.children[3].textContent = lang.theme;    
    
    document.querySelector('.chat-header h3').textContent = lang.chats_title || "Chats";

    // Premium Tag
    if (u.is_premium) document.getElementById("userPremium").innerHTML = lang.premium;
    
    // Language Tag
    const langMap = { en:"🇬🇧 English", ru:"🇷🇺 Русский", hi:"🇮🇳 हिन्दी", es:"🇪🇸 Español", de:"🇩🇪 Deutsch" };
    
    // Agar language code nahi hai to "Not Available" dikhana chahiye? 
    // Usually language code "en" default le lete hain, par agar strict rehna hai:
    if(u.language_code) {
        document.getElementById("userLanguage").textContent = langMap[langCode] || langCode.toUpperCase();
    } else {
        document.getElementById("userLanguage").textContent = lang.not_available;
    }
    
    // User Name Update inside function to support language switch if we use generic "Guest"
    const realName = [u.first_name, u.last_name].filter(Boolean).join(" ");
    document.getElementById("userName").textContent = realName || lang.user_not_found;

    // ID Update
    document.getElementById("userId").textContent = u.id || lang.not_available;

    // Username Update
    document.getElementById("userHandle").textContent = u.username ? "@"+u.username : lang.not_available;
}

// Avatar: Use generic if no photo
document.getElementById("userAvatar").src = u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

// Premium Badge: Hide if not premium
if(u.is_premium) document.getElementById("userPremium").classList.remove("hidden");

// Run Initial Update
updateInterfaceText(code);

lottie.loadAnimation({
  container: document.getElementById("lottie"), renderer: "svg", loop: true, autoplay: true,
  path: "https://assets2.lottiefiles.com/packages/lf20_jv4xehxh.json"
});

document.querySelectorAll(".copyable").forEach(el=>{
  const span = el.querySelector("span");
  // Copy tabhi karein agar text "Not Available" na ho
  el.addEventListener("click",()=>{
    const text = span.textContent.trim();
    const lang = localization[code] || localization.en;
    
    if (text === lang.not_available || text === "—") {
         tg.HapticFeedback.notificationOccurred('error');
         return; // Kuch copy mat karo
    }
    
    navigator.clipboard.writeText(text);
    const tt=document.createElement("div"); tt.className="tooltip"; tt.textContent=lang.copied;
    el.appendChild(tt);
    requestAnimationFrame(()=>tt.style.opacity=1);
    setTimeout(()=>{ tt.style.opacity=0; setTimeout(()=>tt.remove(),200); },1000);
  });
});

// --- LOADER ---
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
                document.getElementById("mainContainer").style.display="flex"; 
                document.querySelector(".container").style.display="block";
                
                const lang = localization[code] || localization.en;
                tg.MainButton.setText(lang.close).setParams({has_shine_effect:true}).show().onClick(()=>tg.close());
            },300);
        }
    }, 18);
}
startLoaderInterval();

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
    
    const lang = localization[code] || localization.en;

    // LANGUAGE
    if (itemText.includes(lang.language)) {
        tg.showPopup({
            title: lang.language_question,
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
    else if (itemText.includes(lang.theme)) {
        const initialColor = localStorage.getItem("customAccentColor") || "#839ef0";
        colorInput.value = initialColor; hexDisplay.value = initialColor.toUpperCase();
        colorOverlay.classList.remove("hidden");
    }
    // MESSAGES
    else if (itemText.includes(lang.messages)) { 
        showChatInterface();
    }
    // SETTINGS
    else if (itemText.includes(lang.settings)) {
         tg.showAlert("Settings not available yet.");
    }
}

// --- CHAT INTERFACE (NO FAKE DATA) ---
const chatContainer = document.getElementById("chatContainer");
const backToProfileBtn = document.getElementById("backToProfileBtn");
const chatList = document.getElementById("chatList");

function showChatInterface() {
    chatContainer.classList.remove("hidden");
    document.getElementById("mainContainer").classList.add("hidden"); 
    tg.BackButton.show(); 
    loadRealChats();
}

function hideChatInterface() {
    chatContainer.classList.add("hidden");
    document.getElementById("mainContainer").classList.remove("hidden"); 
    tg.BackButton.hide();
}

tg.BackButton.onClick(hideChatInterface);
backToProfileBtn.addEventListener("click", hideChatInterface);

function loadRealChats() {
    chatList.innerHTML = ''; 
    
    // Chunki abhi database connected nahi hai, aur "Nakli Data" mana hai.
    // Hum sirf ek message dikhayenge ki koi chats nahi mili.
    
    // Agar hum baad me API connect karenge to yahan fetch code aayega.
    // Abhi ke liye empty state:
    
    const emptyState = document.createElement("div");
    emptyState.className = "loading-chats";
    emptyState.textContent = "No conversations found.";
    emptyState.style.opacity = "0.7";
    emptyState.style.marginTop = "50px";
    
    chatList.appendChild(emptyState);
}


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

setColorBtn.addEventListener("click", () => { applyCustomColor(colorInput.value); hideColorPicker(); });
resetColorBtn.addEventListener("click", () => { localStorage.removeItem("customAccentColor"); applyTheme(theme); tg.showAlert("Reset!"); hideColorPicker(); });
cancelColorBtn.addEventListener("click", hideColorPicker);
