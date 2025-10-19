const API = ""; // si sirves frontend desde mismo host deja vacío
const tokenKey = "evang_token";

const el = id => document.getElementById(id);

async function api(path, opts = {}) {
  const headers = opts.headers || {};
  headers["Content-Type"] = headers["Content-Type"] || "application/json";
  const token = localStorage.getItem(tokenKey);
  if(token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(API + path, {...opts, headers});
  const txt = await res.text();
  try { return JSON.parse(txt); } catch(e) { return txt; }
}

async function init() {
  setupTopbar();
  await loadPosts();
  tryAutoShowComposer();
}

function setupTopbar(){
  const actions = el("topActions");
  const token = localStorage.getItem(tokenKey);
  actions.innerHTML = "";
  if(token) {
    const btn = document.createElement("button"); btn.textContent = "Salir"; btn.onclick = () => { localStorage.removeItem(tokenKey); location.reload(); };
    const profile = document.createElement("a"); profile.href = "/login.html"; profile.textContent = "Perfil";
    actions.appendChild(profile);
    actions.appendChild(btn);
  } else {
    const a = document.createElement("a"); a.href = "/login.html"; a.textContent = "Entrar / Registrarse";
    actions.appendChild(a);
  }
}

async function tryAutoShowComposer(){
  const token = localStorage.getItem(tokenKey);
  if(!token) return;
  const me = await api("/api/me");
  if(me && me.username) {
    el("composer").style.display = "block";
    el("userLabel").textContent = "@" + me.username;
  } else {
    localStorage.removeItem(tokenKey);
  }
}

el("btnPost")?.addEventListener("click", async()=> {
  const text = el("postText").value.trim();
  if(!text) return alert("Escribe algo");
  const r = await api("/api/posts", { method: "POST", body: JSON.stringify({ text }) });
  if(r && r.success) {
    el("postText").value = "";
    await loadPosts();
  } else {
    alert(r.message || "Error publicando. Asegúrate de iniciar sesión.");
  }
});

async function loadPosts(){
  const data = await api("/api/posts");
  const container = el("posts");
  container.innerHTML = "";
  if(!Array.isArray(data) || data.length === 0) {
    container.innerHTML = "<div class='meta'>Sin publicaciones</div>";
    return;
  }
  data.forEach(p => {
    const d = document.createElement("div");
    d.className = "post";
    const t = new Date(p.createdAt || p.created).toLocaleString();
    d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div style="max-width:75%">
        <strong>@${escapeHtml(p.username)}</strong>
        <div class="small">${escapeHtml(p.text)}</div>
      </div>
      <div class="meta">${escapeHtml(t)}</div>
    </div>`;
    container.appendChild(d);
  });
}

function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])) }

init();
