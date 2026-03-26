require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const routes = require("./src/routes");
const bootstrap = require("./src/bootstrap");

const app = express();
const port = process.env.PORT || 3000;

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "https://fabrica-ia.com.br",
    "https://www.fabrica-ia.com.br",
    "https://ideiatoapp.me",
    "https://www.ideiatoapp.me",
    "http://187.77.252.91",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-QG-Token", "x-chave-fabrica"],
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));

// ─── Static (public/) ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ─── Dashboard (legacy) ───────────────────────────────────────────────────────
app.get("/dashboard", (req, res) => {
  const dashHtml = path.join(__dirname, "public", "dashboard.html");
  const indexHtml = path.join(__dirname, "public", "index.html");
  res.sendFile(require("fs").existsSync(dashHtml) ? dashHtml : indexHtml);
});

// ─── Fábrica de IA (frontend) ─────────────────────────────────────────────────
app.get("/fabrica", (req, res) => {
  const fabricaHtml = path.join(__dirname, "public", "fabrica.html");
  if (require("fs").existsSync(fabricaHtml)) {
    res.sendFile(fabricaHtml);
  } else {
    res.status(404).json({ error: "fabrica.html não encontrado em /public" });
  }
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api", routes);

// ─── SPA Fallback (React Router) ─────────────────────────────────────────────
// Deve ficar DEPOIS das rotas API. Serve index.html para qualquer rota
// não reconhecida, permitindo que o React Router gerencie a navegação.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Bootstrap (listen + WhatsApp + Supabase + cron) ─────────────────────────
bootstrap(app, port);
