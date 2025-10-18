// Ajusta al URL donde ejecutes el backend. Si pruebas localmente: http://localhost:3000
const SERVER_URL = window.SERVER_URL || ""; // si sirve desde el mismo host cuando uses Express deja vacío
// Ejemplo si frontend está en otro host: const SERVER_URL = "https://mi-backend.onrender.com";

const el = id => document.getElementById(id);
const tokenKey = "redtext_token";

async function api(path, opts = {}) {
  const headers = opts.headers || {};
  const token = localStorage.getItem(tokenKey);
  if(token) headers["Authorization"] = "Bearer " + token;
  headers["Content-Type"] = headers["Content-Type"] || "application/json";
  const res = await fetch((SERVER_URL || "") + path, {...opts, headers});
  const text = await res.text();
  try { return JSON.parse(text); } catch(e) { return text; }
}

async function init(){
  setupUI();
  await loadPosts();
}

function setupUI(){
  const username = el("username");
  const password = el("password");
  el("btnLogin").onclick = async () => {
    const u = username.value.trim();
    const p = password.value;
    if(!u || !p) return alert("Completa usuario y contraseña");
    const res = await api("/api/login", { method: "POST", body: JSON.stringify({username:u,password:p}) });
    if(res && res.token){
      localStorage.setItem(tokenKey, res.token);
      afterLogin(res.username);
    } else {
      alert(res.message || "Error login");
    }
  };
  el("btnSignup").onclick = async () => {
    const u = username.value.trim();
    const p = password.value;
    if(!u || !p) return alert("Completa usuario y contraseña");
    const res = await api("/api/signup", { method: "POST", body: JSON.stringify({username:u,password:p}) });
    if(res && res.token){
      localStorage.setItem(tokenKey, res.token);
      afterLogin(res.username);
    } else {
      alert(res.message || "Error al crear");
    }
  };
  el("btnLogout").onclick = () => {
    localStorage.removeItem(tokenKey);
    el("btnLogout").style.display = "none";
    el("btnLogin").style.display = "";
    el("btnSignup").style.display = "";
    el("publishBox").style.display = "none";
    el("loginForm").style.display = "";
    el("welcome").style.display = "block";
    el("userLabel").textContent = "";
  };
  el("btnPost").onclick = async () => {
    const text = el("postText").value.trim();
    if(!text) return;
    const res = await api("/api/posts", { method:"POST", body: JSON.stringify({ text }) });
    if(res && res.success){
      el("postText").value = "";
      await loadPosts();
    } else {
      alert(res.message || "Error publicando");
    }
  };

  // show login form by default
  el("loginForm").style.display = "";
  el("publishBox").style.display = "none";

  // try to fetch current user
  const token = localStorage.getItem(tokenKey);
  if(token){
    // verify token by calling /api/me
    api("/api/me").then(r => {
      if(r && r.username) afterLogin(r.username);
      else {
        localStorage.removeItem(tokenKey);
      }
    }).catch(()=>localStorage.removeItem(tokenKey));
  }
}

function afterLogin(username){
  el("welcome").style.display = "none";
  el("loginForm").style.display = "none";
  el("publishBox").style.display = "block";
  el("userLabel").textContent = "@" + username;
  el("btnLogout").style.display = "";
  el("btnLogin").style.display = "none";
  el("btnSignup").style.display = "none";
}

async function loadPosts(){
  const data = await api("/api/posts");
  const container = el("posts");
  container.innerHTML = "";
  if(!Array.isArray(data) || data.length === 0){
    container.innerHTML = "<div class='meta'>Sin publicaciones</div>";
    return;
  }
  data.forEach(p => {
    const d = document.createElement("div");
    d.className = "post";
    const time = new Date(p.created || p.time || p.createdAt || p.created_at).toLocaleString();
    d.innerHTML = `<div style="display:flex;justify-content:space-between">
      <div><strong>@${escapeHtml(p.username)}</strong><div class="meta">${escapeHtml(p.text)}</div></div>
      <div class="meta">${escapeHtml(time)}</div>
    </div>`;
    container.appendChild(d);
  });
}

function escapeHtml(s){ return String(s||"").replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])) }

init();
