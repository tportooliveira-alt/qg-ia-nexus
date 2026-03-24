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
    "https://ideiatoapp.me",
    "https://www.ideiatoapp.me",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-QG-Token"],
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

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api", routes);

// ─── SPA Fallback (React Router) ─────────────────────────────────────────────
// Deve ficar DEPOIS das rotas API. Serve index.html para qualquer rota
// não reconhecida, permitindo que o React Router gerencie a navegação.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Bootstrap (listen + WhatsApp + MySQL + cron) ────────────────────────────
bootstrap(app, port);
