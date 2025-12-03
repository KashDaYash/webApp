/* ---------------------------------------------------------
   TELEGRAM INITIAL SETUP
--------------------------------------------------------- */
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableVerticalSwipes();

// Inline button → sendData fix
tg.sendData("request_user");

/* ---------------------------------------------------------
   API BASE URL (FIXED)
--------------------------------------------------------- */
const API_BASE = "https://profiletele.vercel.app/api";

/* ---------------------------------------------------------
   LOADING SCREEN
--------------------------------------------------------- */
let prog = 0;
const bar = document.getElementById("progressBar");
const txt = document.getElementById("progressText");

let loadInterval = setInterval(() => {
  prog += 1;
  bar.style.width = prog + "%";
  txt.textContent = prog + "%";

  if (prog >= 100) {
    clearInterval(loadInterval);
    setTimeout(() => {
      document.getElementById("loadingScreen").style.opacity = "0";
      setTimeout(() => {
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("app").classList.remove("hidden");
      }, 400);
    }, 200);
  }
}, 18);

/* ---------------------------------------------------------
   USER DATA FETCH LOOP
--------------------------------------------------------- */
let currentUser = {};

async function fetchUser() {
  try {
    const r = await fetch(`${API_BASE}/user`);
    currentUser = await r.json();

    if (!currentUser.id) return;

    // PROFILE FIELDS
    document.getElementById("userId").textContent = currentUser.id;

    document.getElementById("userHandle").textContent =
      currentUser.username ? "@" + currentUser.username : "—";  // FIXED

    // Full name
    const fullName =
      (currentUser.first_name || "") +
      " " +
      (currentUser.last_name || "");
    document.getElementById("userName").textContent =
      fullName.trim() || "User";

    // Avatar
    if (currentUser.photo_url) {
      document.getElementById("userAvatar").src = currentUser.photo_url;
    }

    // Premium badge
    if (currentUser.is_premium) {
      document.getElementById("userPremium").classList.remove("hidden");
    }

    // Language
    document.getElementById("userLanguage").textContent =
      (currentUser.language_code || "EN").toUpperCase();

    // Welcome title
    document.getElementById("welcomeTitle").textContent =
      "Welcome " + (currentUser.first_name || "");

    // Coins (Home + Stats)
    const coins = currentUser.coins ?? 0;
    document.getElementById("homeCoins").textContent = coins;
    document.getElementById("statsCoins").textContent = coins;

  } catch (err) {
    console.warn("User fetch error:", err);
  }
}

setInterval(fetchUser, 700);

/* ---------------------------------------------------------
   LOTTIE ANIMATIONS
--------------------------------------------------------- */
setTimeout(() => {
  try {
    // Avatar glow
    lottie.loadAnimation({
      container: document.getElementById("avatarGlow"),
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "https://lottie.host/6e4c90cb-8f89-4bbf-8dc6-dc016fcfe948/zx2Vzzb7eU.json"
    });

    // Stats animation
    lottie.loadAnimation({
      container: document.getElementById("statsLottie"),
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "https://lottie.host/9e2f0f12-5fb5-4b65-af49-77b7d19c6582/SmmY6gPRif.json"
    });
  } catch {}
}, 700);

/* ---------------------------------------------------------
   SPA NAVIGATION (FIXED)
--------------------------------------------------------- */
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

function openPage(id) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  navItems.forEach(n => n.classList.remove("active"));
  document
    .querySelector(`.nav-item[data-page="${id}"]`)
    .classList.add("active");
}

// Navbar click
navItems.forEach(btn => {
  btn.addEventListener("click", () => openPage(btn.dataset.page));
});

// FIX: Home "View Profile" button
document.querySelectorAll("[data-open]").forEach(btn => {
  btn.onclick = () => openPage(btn.dataset.open);
});

/* ---------------------------------------------------------
   THEME SYSTEM (LIGHT / DARK)
--------------------------------------------------------- */
const themeToggle = document.getElementById("themeToggle");
const themeSelect = document.getElementById("themeSelect");

let theme = localStorage.getItem("theme") || "dark";
applyTheme(theme);
themeSelect.value = theme;

// profile toggle button
themeToggle.onclick = () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  themeSelect.value = theme;
  applyTheme(theme);
};

// settings dropdown
themeSelect.onchange = e => {
  theme = e.target.value;
  localStorage.setItem("theme", theme);
  applyTheme(theme);
};

function applyTheme(name) {
  if (name === "light") {
    document.documentElement.classList.remove("dark");
    themeToggle.textContent = "🌙";
  } else {
    document.documentElement.classList.add("dark");
    themeToggle.textContent = "☀️";
  }
}

/* ---------------------------------------------------------
   LANGUAGE SELECTOR
--------------------------------------------------------- */
document.getElementById("langSelect").onchange = e => {
  const ln = e.target.value;
  localStorage.setItem("lang", ln);
  document.getElementById("userLanguage").textContent = ln.toUpperCase();
};

document.getElementById("langSelect").value =
  localStorage.getItem("lang") || "en";

/* ---------------------------------------------------------
   CHAT SYSTEM FIXED
--------------------------------------------------------- */
const chatArea = document.getElementById("chatArea");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

// user send
chatSend.onclick = sendMsg;
chatInput.onkeypress = e => {
  if (e.key === "Enter") sendMsg();
};

function sendMsg() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  addBubbleUser(msg);
  chatInput.value = "";

  fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ msg })
  });
}

// user bubble
function addBubbleUser(msg) {
  const div = document.createElement("div");
  div.className = "chat-bubble-user";
  div.textContent = msg;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// owner bubble
function addBubbleOwner(msg) {
  const div = document.createElement("div");
  div.className = "chat-bubble-owner";
  div.textContent = msg;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

let lastOwnerMsg = "";

// Poll owner replies
setInterval(async () => {
  try {
    const r = await fetch(`${API_BASE}/chat`);
    const data = await r.json();

    if (data.owner && data.owner !== lastOwnerMsg) {
      lastOwnerMsg = data.owner;
      addBubbleOwner(lastOwnerMsg);
    }
  } catch {}
}, 1200);
