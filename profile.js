// Command: profile.js
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableVerticalSwipes();

try { tg.requestFullscreen(); } catch(e){}

tg.setHeaderColor("#1c1c1c");
tg.setBackgroundColor("#1e1e1e");
tg.setBottomBarColor("#000000");

/* Theme */
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");
let theme = localStorage.getItem("theme") || tg.colorScheme || "dark";

applyTheme(theme);

toggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  toggle.classList.add("animate");
  toggle.addEventListener("animationend",()=>toggle.classList.remove("animate"),{once:true});
  applyTheme(theme);
});

function applyTheme(name){
  if(name==="light"){
    root.classList.add("light-theme");
    toggle.textContent="☀️";
  } else {
    root.classList.remove("light-theme");
    toggle.textContent="🌙";
  }
}

/* USER DATA */
const u = tg.initDataUnsafe?.user || {};

document.getElementById("userAvatar").src =
  u.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

document.getElementById("userName").textContent =
  [u.first_name, u.last_name].filter(Boolean).join(" ") || "Guest";

if(u.is_premium){
  const p=document.getElementById("userPremium");
  p.classList.remove("hidden");
  p.innerHTML=`💸 Premium`;
}

document.getElementById("userHandle").textContent =
  u.username ? "@"+u.username : "—";

document.getElementById("userId").textContent =
  u.id || "—";

const langMap = {
  en:"🇬🇧 English", ru:"🇷🇺 Русский", hi:"🇮🇳 हिन्दी",
  es:"🇪🇸 Español", de:"🇩🇪 Deutsch"
};
const code = (u.language_code || "en").split("-")[0];
document.getElementById("userLanguage").textContent =
  langMap[code] || code.toUpperCase();

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
    tt.className="tooltip"; tt.textContent="Copied!";
    el.appendChild(tt);
    requestAnimationFrame(()=>tt.style.opacity=1);
    setTimeout(()=>{
      tt.style.opacity=0;
      setTimeout(()=>tt.remove(),200);
    },1000);
  });
});

/* Loader */
let prog=0;
const bar=document.getElementById("progressBar");
const txt=document.getElementById("progressText");

const interval=setInterval(()=>{
  prog+=1;
  bar.style.width=prog+"%";
  txt.textContent=prog+"%";

  if(prog>=100){
    clearInterval(interval);
    document.getElementById("loadingScreen").style.opacity="0";
    setTimeout(()=>{
      document.getElementById("loadingScreen").style.display="none";
      document.querySelector(".container").style.display="block";
      tg.MainButton.setText("✦ Close Profile ✦")
        .setParams({has_shine_effect:true})
        .show()
        .onClick(()=>tg.close());
    },300);
  }
},18);

/* Expandable Menu */
const menuToggle=document.getElementById("menuToggle");
const menuBody=document.getElementById("menuBody");

menuToggle.addEventListener("click",()=>{
  const open = menuBody.style.display==="flex";
  menuBody.style.display = open ? "none" : "flex";
  menuToggle.classList.toggle("rotated", !open);
});