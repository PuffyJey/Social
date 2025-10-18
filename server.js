const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const DB_USERS = path.join(__dirname, "users.json");
const DB_POSTS = path.join(__dirname, "posts.json");
const JWT_SECRET = process.env.JWT_SECRET || "CAMBIA_ESTO_POR_UNA_CLAVE_SECRETA";

// helpers: read/write JSON
function readJSON(file) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// init DB files if missing
if(!fs.existsSync(DB_USERS)) writeJSON(DB_USERS, []);
if(!fs.existsSync(DB_POSTS)) writeJSON(DB_POSTS, []);

// app
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// register
app.post("/api/signup", (req, res) => {
  const { username, password } = req.body || {};
  if(!username || !password) return res.status(400).json({ success:false, message: "Faltan campos" });
  const users = readJSON(DB_USERS);
  if(users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ success:false, message: "Usuario ya existe" });
  }
  const hash = bcrypt.hashSync(password, 10);
  const user = { id: uuidv4(), username, password: hash, created: new Date().toISOString() };
  users.push(user);
  writeJSON(DB_USERS, users);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ success:true, token, username: user.username });
});

// login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if(!username || !password) return res.status(400).json({ success:false });
  const users = readJSON(DB_USERS);
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if(!user) return res.status(401).json({ success:false, message:"Usuario no encontrado" });
  if(!bcrypt.compareSync(password, user.password)) return res.status(401).json({ success:false, message:"Contraseña incorrecta" });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ success:true, token, username: user.username });
});

// auth middleware
function authMiddleware(req, res, next){
  const header = req.headers["authorization"];
  if(!header) return res.status(401).json({ success:false, message:"No autorizado" });
  const parts = header.split(" ");
  if(parts.length !== 2) return res.status(401).json({ success:false });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ success:false, message:"Token inválido" });
  }
}

// create post (auth required)
app.post("/api/posts", authMiddleware, (req, res) => {
  const { text } = req.body || {};
  if(!text || text.trim().length === 0) return res.status(400).json({ success:false });
  const posts = readJSON(DB_POSTS);
  const newPost = {
    id: uuidv4(),
    username: req.user.username,
    text: text.trim().slice(0, 1000),
    created: new Date().toISOString()
  };
  posts.push(newPost);
  writeJSON(DB_POSTS, posts);
  res.json({ success:true, post: newPost });
});

// get posts (public)
app.get("/api/posts", (req, res) => {
  const posts = readJSON(DB_POSTS);
  // return sorted newest first
  posts.sort((a,b) => new Date(b.created) - new Date(a.created));
  res.json(posts);
});

// get me
app.get("/api/me", authMiddleware, (req, res) => {
  res.json({ success:true, username: req.user.username });
});

// fallback to index.html for SPA routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
