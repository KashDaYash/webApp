// Command: profile.js
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableVerticalSwipes();

try { tg.requestFullscreen(); } catch(e){}

tg.setHeaderColor("#1c1c1c");
tg.setBackgroundColor("#1e1e1e");
tg.setBottomBarColor("#000000");

// --- START: Localization Dictionary (Step 3) ---
const localization = {
  // English Translations
  en: {
    title: "Your Profile",
    premium: "💸 Premium",
    id: "ID:",
    username: "Username:",
    options: "Options",
    settings: "⚙ Settings",
    messages: "📩 Messages",
    language: "🌐 Language",
    subscription: "💱 Subscription",
    theme: "🎨 Theme Customizer",
    close: "✦ Close Profile ✦",
    copied: "Copied!",
    // ---
    language_question: "Select Language:",
    language_current_en: "Interface Language changed to English.",
    language_current_hi: "Interface Language changed to Hindi.",
    language_button_en: "English",
    language_button_hi: "हिन्दी"
  },
  
  // Hindi Translations
  hi: {
    title: "आपकी प्रोफाइल",
    premium: "💸 प्रीमियम",
    id: "आईडी:",
    username: "यूज़रनेम:",
    options: "विकल्प",
    settings: "⚙ सेटिंग्स",
    messages: "📩 संदेश",
    language: "🌐 भाषा",
    subscription: "💱 सदस्यता",
    theme: "🎨 थीम कस्टमाइज़र",
    close: "✦ प्रोफाइल बंद करें ✦",
    copied: "कॉपी किया गया!",
    // ---
    language_question: "भाषा चुनें:",
    language_current_en: "इंटरफ़ेस भाषा अंग्रेजी में बदल दी गई है।",
    language_current_hi: "इंटरफ़ेस भाषा हिंदी में बदल दी गई है।",
    language_button_en: "English",
    language_button_hi: "हिन्दी"
  }
};
// --- END: Localization Dictionary ---


/* Theme Logic */
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");
let theme = localStorage.getItem("theme") || tg.colorScheme || "dark";

// Function to dynamically update theme colors
function applyCustomColor(hexColor) {
  if (!/^#([0-9A-F]{3}){1,2}$/i.test(hexColor)) {
    tg.showAlert("Invalid Hex Code! Please use format #RRGGBB.");
    return;
  }

  // 1. CSS Variables Update
  root.style.setProperty('--accent', hexColor);

  // 2. Calculate a transparent version for the glow effect
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const glowColor = `rgba(${r}, ${g}, ${b}, 0.45)`;
  root.style.setProperty('--glow', glowColor);

  // 3. Save to localStorage
  localStorage.setItem("customAccentColor", hexColor);
  
  tg.showAlert("Theme color successfully updated! 🎨");
}

function applyTheme(name){
  // Check for saved custom color first
  const customColor = localStorage.getItem("customAccentColor");
  if (customColor) {
    // applyCustomColor ko bina alert ke call karne ke liye, thoda modify karna padega
    // Abhi simple rakhte hain, ya applyCustomColor mein logic rakhte hain ki woh save bhi kare aur apply bhi
    root.style.setProperty('--accent', customColor);
    
    const r = parseInt(customColor.slice(1, 3), 16);
    const g = parseInt(customColor.slice(3, 5), 16);
    const b = parseInt(customColor.slice(5, 7), 16);
    const glowColor = `rgba(${r}, ${g}, ${b}, 0.45)`;
    root.style.setProperty('--glow', glowColor);

  } else {
    // Revert to default colors if no custom color is saved
    root.style.removeProperty('--accent');
    root.style.removeProperty('--glow');
  }

  if(name==="light"){
    root.classList.add("light-theme");
    toggle.textContent="☀️";
  } else {
    root.classList.remove("light-theme");
    toggle.textContent="🌙";
  }
}
applyTheme(theme); // Apply theme immediately on load

toggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  toggle.classList.add("animate");
  toggle.addEventListener("animationend",()=>toggle.classList.remove("animate"),{once:true});
  applyTheme(theme);
});


/* USER DATA & Language Update */
const u = tg.initDataUnsafe?.user || {};
let code = (u.language_code || "en").split("-")[0]; // Global language code

// Function to update all static text in the interface (Step 3)
function updateInterfaceText(langCode) {
    const lang = localization[langCode] || localization.en;

    document.title = lang.title;

    document.querySelector('.profile-body .info:nth-child(1) strong').textContent = lang.id;
    document.querySelector('.profile-body .info:nth-child(2) strong').textContent = lang.username;
    
    document.querySelector('.menu-header h3').textContent = lang.options;

    document.getElementById("menuBody").children[0].textContent = lang.settings;
    document.getElementById("menuBody").children[1].textContent = lang.messages;
    document.getElementById("menuBody").children[2].textContent = lang.language;
    document.getElementById("menuBody").children[3].textContent = lang.subscription;
    document.getElementById("menuBody").children[4].textContent = lang.theme;

    const p = document.getElementById("userPremium");
    if (u.is_premium) {
        p.innerHTML = lang.premium;
    }
    
    const langMap = {
        en:"🇬🇧 English", ru:"🇷🇺 Русский", hi:"🇮🇳 हिन्दी",
        es:"🇪🇸 Español", de:"🇩🇪 Deutsch"
    };
    document.getElementById("userLanguage").textContent = langMap[langCode] || langCode.toUpperCase();
}

// Set initial user data (before verification)
document.getElementById("userAvatar").src =
  u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

document.getElementById("userName").textContent =
  [u.first_name, u.last_name].filter(Boolean).join(" ") || "Guest";

if(u.is_premium){
  document.getElementById("userPremium").classList.remove("hidden");
}

document.getElementById("userHandle").textContent =
  u.username ? "@"+u.username : "—";

document.getElementById("userId").textContent =
  u.id || "—";

updateInterfaceText(code); // Initial Language Load


/* Lottie */
lottie.loadAnimation({
  container: document.getElementById("lottie"),
  renderer: "svg", loop: true, autoplay: true,
  path: "https://assets2.lottiefiles.com/packages/lf20_jv4xehxh.json"
});

/* Copy Tooltip */
document.querySelectorAll(".copyable").forEach(el=>{
  const span = el.querySelector("span");
  el.addEventListener("click",()=>{
    navigator.clipboard.writeText(span.textContent.trim());
    const tt=document.createElement("div");
    tt.className="tooltip"; tt.textContent=localization[code].copied;
    el.appendChild(tt);
    requestAnimationFrame(()=>tt.style.opacity=1);
    setTimeout(()=>{
      tt.style.opacity=0;
      setTimeout(()=>tt.remove(),200);
    },1000);
  });
});

/* --- START: TWA VERIFICATION LOGIC (Step 5) --- */
const initData = tg.initData; 
const VERCEL_BASE_URL = "https://webapp-seven-lilac.vercel.app";


let IS_USER_VERIFIED = false;

// Loader Interval function (Wrapped the original logic)
let prog = 0;
const bar = document.getElementById("progressBar");
const txt = document.getElementById("progressText");

function startLoaderInterval() {
    const interval = setInterval(()=>{
        prog += 1;
        bar.style.width = prog + "%";
        txt.textContent = prog + "%";

        if(prog >= 100){
            clearInterval(interval);
            document.getElementById("loadingScreen").style.opacity="0";
            setTimeout(()=>{
                document.getElementById("loadingScreen").style.display="none";
                document.querySelector(".container").style.display="block";
                tg.MainButton.setText(localization[code].close)
                    .setParams({has_shine_effect:true})
                    .show()
                    .onClick(()=>tg.close());
            },300);
        }
    }, 18);
}

// Verification function (Called immediately)
async function verifyUserAndStartApp() {
    try {
        const response = await fetch(`${VERCEL_BASE_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: initData })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            IS_USER_VERIFIED = true;
            console.log("User verification successful. User ID:", data.user_id);
            // Verification ke baad loader shuru karein
            startLoaderInterval(); 
        } else {
            tg.showAlert("Verification Failed: " + data.message);
            tg.close();
        }
    } catch (error) {
        console.error("Verification failed:", error);
        tg.showAlert("Network Error. Please check your VERCEL_BASE_URL.");
        tg.close();
    }
}

verifyUserAndStartApp();
/* --- END: TWA VERIFICATION LOGIC --- */


/* Expandable Menu */
const menuToggle=document.getElementById("menuToggle");
const menuBody=document.getElementById("menuBody");
const menuItems = document.querySelectorAll(".menu-item");

menuToggle.addEventListener("click",()=>{
  const open = menuBody.style.display==="flex";
  menuBody.style.display = open ? "none" : "flex";
  menuToggle.classList.toggle("rotated", !open);
});


// Menu Item Click Handler
menuItems.forEach(item => {
    item.addEventListener("click", handleMenuItemClick);
});

function handleMenuItemClick(event) {
    const itemText = event.currentTarget.textContent.trim();
    tg.HapticFeedback.impactOccurred('light');

    // Menu band karen
    menuBody.style.display = "none";
    menuToggle.classList.remove("rotated");
    
    // --- LANGUAGE SELECTION LOGIC ---
    if (itemText.includes(localization[code].language)) {
        
        const langPopupTitle = localization[code].language_question;
        
        // Simple language selection using popup
        tg.showPopup({
            title: langPopupTitle,
            message: "Choose your interface language:",
            buttons: [
                { id: 'en', text: '🇬🇧 English', type: 'default' },
                { id: 'hi', text: '🇮🇳 हिन्दी', type: 'default' },
                { id: 'cancel', text: localization[code].close, type: 'cancel' }
            ]
        }, (buttonId) => {
            if (buttonId === 'en' || buttonId === 'hi') {
                code = buttonId; // Update global language code
                localStorage.setItem("languageCode", buttonId);
                updateInterfaceText(code); // Update all texts
                
                const successMsgKey = (buttonId === 'en') ? 'language_current_en' : 'language_current_hi';
                tg.showAlert(localization[code][successMsgKey]);
            }
        });
    } 
    // --- THEME CUSTOMIZER LOGIC ---
    else if (itemText.includes(localization[code].theme)) {
        
        const initialColor = localStorage.getItem("customAccentColor") || "#839ef0";
        colorInput.value = initialColor;
        hexDisplay.value = initialColor.toUpperCase();

        // Show the custom color picker overlay
        colorOverlay.classList.remove("hidden");
    }
    // --- MESSAGES LOGIC (Placeholder for now) ---
    else if (itemText.includes(localization[code].messages)) { 
        const telegramUsername = "KashDaYash"; // CHANGE THIS to your actual username/bot
        tg.showAlert(`Preparing Chat System...`);
        // We will replace this with showing the Chat UI container in the next step
    }
    // --- SETTINGS / SUBSCRIPTION (Placeholders) ---
    else if (itemText.includes(localization[code].settings)) {
        tg.showAlert("Settings functionality coming soon!");
    } else if (itemText.includes(localization[code].subscription)) {
        tg.showAlert("Subscription feature coming soon! (Premium: " + (u.is_premium ? "Active" : "Not Active") + ")");
    }
}

/* --- Color Picker Button Actions --- */
const colorOverlay = document.getElementById("colorPickerOverlay");
const colorInput = document.getElementById("colorPickerInput");
const hexDisplay = document.getElementById("hexInputDisplay");
const setColorBtn = document.getElementById("setColorBtn");
const resetColorBtn = document.getElementById("resetColorBtn");
const cancelColorBtn = document.getElementById("cancelColorBtn");

// Sync color picker with hex display
colorInput.addEventListener('input', () => {
    hexDisplay.value = colorInput.value.toUpperCase();
});
hexDisplay.addEventListener('input', () => {
    if (/^#([0-9A-F]{3}){1,2}$/i.test(hexDisplay.value)) {
        colorInput.value = hexDisplay.value;
    }
});

// Function to hide the overlay
function hideColorPicker() {
    colorOverlay.classList.add("hidden");
}

// 1. Set Color Button
setColorBtn.addEventListener("click", () => {
    const newColor = colorInput.value;
    applyCustomColor(newColor); 
    hideColorPicker();
});

// 2. Reset Default Button
resetColorBtn.addEventListener("click", () => {
    localStorage.removeItem("customAccentColor");
    applyTheme(theme); 
    tg.showAlert(localization[code].language_current_en.includes("English") ? "Custom color has been reset to default." : "कस्टम रंग डिफ़ॉल्ट पर रीसेट हो गया है।");
    hideColorPicker();
});

// 3. Cancel Button
cancelColorBtn.addEventListener("click", hideColorPicker);
 
