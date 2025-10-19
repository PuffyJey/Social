const API = ""; // si el frontend se sirve desde el mismo dominio deja vacío
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

el("btnLogin").onclick = async () => {
  const u = el("username").value.trim();
  const p = el("password").value;
  if(!u || !p) { el("msg").textContent = "Completa usuario y contraseña"; return; }
  const r = await api("/api/login", { method: "POST", body: JSON.stringify({ username: u, password: p }) });
  if(r && r.token){
    localStorage.setItem(tokenKey, r.token);
    window.location.href = "/index.html";
  } else {
    el("msg").textContent = r.message || "Error al iniciar";
  }
};

el("btnSignup").onclick = async () => {
  const u = el("username").value.trim();
  const p = el("password").value;
  if(!u || !p) { el("msg").textContent = "Completa usuario y contraseña"; return; }
  const r = await api("/api/signup", { method: "POST", body: JSON.stringify({ username: u, password: p }) });
  if(r && r.token){
    localStorage.setItem(tokenKey, r.token);
    window.location.href = "/index.html";
  } else {
    el("msg").textContent = r.message || "Error al crear cuenta";
  }
};

// If Google redirected back with token in query, store it
(function handleGoogleToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if(token) {
    localStorage.setItem(tokenKey, token);
    // remove querystring and redirect to feed
    window.location.href = "/index.html";
  }
})();
