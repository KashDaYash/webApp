/* ---------------------------------------------------------
   TELEGRAM WEBAPP INITIAL SETUP
--------------------------------------------------------- */

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.enableVerticalSwipes();

/* Inline button fix → ask bot for real user */
tg.sendData("request_user");

/* ---------------------------------------------------------
   LOADING SCREEN ANIMATION
--------------------------------------------------------- */

let prog = 0;
let bar = document.getElementById("progressBar");
let txt = document.getElementById("progressText");

let loadInt = setInterval(() => {
  prog += 1;
  bar.style.width = prog + "%";
  txt.textContent = prog + "%";

  if (prog >= 100) {
    clearInterval(loadInt);
    setTimeout(() => {
      document.getElementById("loadingScreen").style.opacity = "0";
      setTimeout(() => {
        document.getElementById("loadingScreen").style.display = "none";
        document.getElementById("app").style.opacity = "1";
      }, 400);
    }, 300);
  }
}, 18);

/* ---------------------------------------------------------
   FETCH REAL USER DATA FROM BOT → VIA /api/user
--------------------------------------------------------- */

let currentUser = {};

async function fetchUser() {
  try {
    const res = await fetch("/api/user");
    const u = await res.json();

    if (!u || !u.id) return; // still loading

    currentUser = u;

    // update profile
    document.getElementById("userId").textContent = u.id;
    document.getElementById("userHandle").textContent =
      u.username ? "@" + u.username : "—";

    document.getElementById("userName").textContent =
      (u.first_name || "") + " " + (u.last_name || "");

    // avatar
    if (u.photo_url) {
      document.getElementById("userAvatar").src = u.photo_url;
    }

    // premium
    if (u.is_premium) {
      document.getElementById("userPremium").classList.remove("hidden");
    }

    // language
    document.getElementById("userLanguage").textContent =
      (u.language_code || "EN").toUpperCase();

    // welcome name
    document.getElementById("welcomeTitle").textContent =
      "Welcome " + (u.first_name || "User");

    // coins (dynamic)
    document.getElementById("homeCoins").textContent =
      "Coins: " + (u.coins ?? 0);
    document.getElementById("statsCoins").textContent =
      u.coins ?? 0;

  } catch (e) {
    console.warn("User fetch error", e);
  }
}

// keep checking every 700ms (inline safe)
setInterval(fetchUser, 700);

/* ---------------------------------------------------------
   LOTTIE SETUP (Profile Avatar Glow + Stats Animation)
--------------------------------------------------------- */

setTimeout(() => {
  try {
    lottie.loadAnimation({
      container: document.getElementById("lottie"),
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "https://lottie.host/2f73f588-1d2c-4b19-bc69-e7c43ee1f625/KVzBpsp6jf.json"
    });

    lottie.loadAnimation({
      container: document.getElementById("statsLottie"),
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "https://lottie.host/b9e7025e-3f2b-4327-9c53-5fc1f76803ea/mCqk4jGz5D.json"
    });
  } catch (e) {}
}, 800);

/* ---------------------------------------------------------
   SPA PAGE ROUTER
--------------------------------------------------------- */

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

function openPage(pg) {
  // remove active highlight
  navItems.forEach(n => n.classList.remove("active"));
  // add to current
  document.querySelector(`.nav-item[data-page="${pg}"]`)
    .classList.add("active");

  // animate pages
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pg).classList.add("active");
}

// click listener
navItems.forEach(btn => {
  btn.addEventListener("click", () => {
    openPage(btn.dataset.page);
  });
});

// quick buttons from home
document.querySelectorAll("[data-open]").forEach(btn => {
  btn.onclick = () => {
    openPage(btn.dataset.open);
  };
});

/* ---------------------------------------------------------
   THEME TOGGLE (Glass + Neon)
--------------------------------------------------------- */

const themeBtn = document.getElementById("themeToggle");
let theme = localStorage.getItem("theme") || "dark";

setTheme(theme);

themeBtn.onclick = () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", theme);
  setTheme(theme);
};

function setTheme(th) {
  if (th === "light") {
    document.documentElement.classList.add("light");
    themeBtn.textContent = "☀️";
  } else {
    document.documentElement.classList.remove("light");
    themeBtn.textContent = "🌙";
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

// auto-select English if not set
if (!localStorage.getItem("lang")) {
  localStorage.setItem("lang", "en");
}
document.getElementById("langSelect").value =
  localStorage.getItem("lang");

/* ---------------------------------------------------------
   CHAT WITH OWNER (WebApp → /api/chat → bot)
--------------------------------------------------------- */

const chatArea = document.getElementById("chatArea");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

// send message
chatSend.onclick = sendMsg;
chatInput.onkeypress = e => {
  if (e.key === "Enter") sendMsg();
};

function sendMsg() {
  let text = chatInput.value.trim();
  if (!text) return;

  // print bubble
  addUserBubble(text);
  chatInput.value = "";

  // send to API
  fetch("/api/chat", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ msg: text })
  });
}

// add user bubble
function addUserBubble(msg) {
  const div = document.createElement("div");
  div.className = "chat-bubble-user";
  div.textContent = msg;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// add owner bubble
function addOwnerBubble(msg) {
  const div = document.createElement("div");
  div.className = "chat-bubble-owner";
  div.textContent = msg;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

/* Poll for owner replies */
setInterval(async () => {
  try {
    const res = await fetch("/api/chat");
    const data = await res.json();

    if (data && data.msg && data.msg !== lastOwnerMsg) {
      lastOwnerMsg = data.msg;
      addOwnerBubble(data.msg);
    }
  } catch {}
}, 1200);

let lastOwnerMsg = "";
