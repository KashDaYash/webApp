const tg = window.Telegram.WebApp;
tg.ready();

// request REAL user data from bot (inline supported)
tg.sendData("request_user");

// fetch user every 800ms
setInterval(fetchUser, 800);

async function fetchUser(){
  const r = await fetch("/api/user");
  const u = await r.json();
  if(!u.id) return;

  document.getElementById("userId").textContent = u.id;

  document.getElementById("userHandle").textContent =
    u.username ? "@"+u.username : "—";

  document.getElementById("userName").textContent =
    u.first_name + " " + (u.last_name ?? "");

  document.getElementById("welcomeTitle").textContent =
    "Welcome " + u.first_name;

  // coins dynamic
  document.getElementById("homeCoins").textContent =
    "Coins: " + (u.coins ?? 0);

  // language
  document.getElementById("userLanguage").textContent =
    u.language_code ?? "EN";

  if(u.is_premium){
    document.getElementById("userPremium").classList.remove("hidden");
  }
}

// navigation
document.querySelectorAll(".nav-item").forEach(btn=>{
  btn.onclick = () => {
    document.querySelectorAll(".nav-item")
      .forEach(n=>n.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".page")
      .forEach(p=>p.classList.remove("active"));

    const pg = btn.dataset.page;
    document.getElementById(pg).classList.add("active");
  };
});

// chat system
document.getElementById("chatSend").onclick = async ()=>{
  const msg = document.getElementById("chatInput").value.trim();
  if(!msg) return;
  document.getElementById("chatInput").value = "";

  const box = document.getElementById("chatArea");
  box.innerHTML += `<div>You: ${msg}</div>`;

  await fetch("/api/chat",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({msg})
  });
}; 
