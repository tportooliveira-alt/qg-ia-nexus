const { Router } = require("express");
const { autenticarToken } = require("../services/authMiddleware");

const router = Router();

function isLocalRequest(req) {
  const isLoopback = (value) =>
    value === "127.0.0.1" ||
    value === "::1" ||
    value === "::ffff:127.0.0.1";

  const socketRemote = req.socket?.remoteAddress || "";
  if (!isLoopback(socketRemote)) return false;

  const realIp = String(req.headers["x-real-ip"] || "").trim();
  if (realIp && !isLoopback(realIp)) return false;

  const forwarded = String(req.headers["x-forwarded-for"] || "").trim();
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first && !isLoopback(first)) return false;
  }

  return true;
}

router.get("/auth/verify", autenticarToken, (req, res) => {
  res.json({ status: "ok", autenticado: true });
});

router.get("/status", (req, res) => {
  const mem = process.memoryUsage();
  const waAtivo = process.env.ENABLE_WHATSAPP === "true";
  res.json({
    status: "Operacional",
    agente: "NEXUS CLAW",
    uptime: process.uptime(),
    token_volume: process.env.TOKEN_VOLUME || "normal",
    memoria: {
      rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`
    },
    servicos: {
      whatsapp: waAtivo ? "Ativado" : "Desativado",
      autoHealing: "Ativado",
      multiIA: "Ativado",
      cron_pesquisa: "A cada 6h"
    }
  });
});

// Endpoint sem token para manutencao via terminal no proprio servidor (localhost apenas)
router.get("/internal/diagnostic", (req, res) => {
  if (!isLocalRequest(req)) {
    return res.status(403).json({
      error: "Acesso negado. Endpoint permitido apenas via localhost."
    });
  }

  const mem = process.memoryUsage();
  res.json({
    status: "ok",
    host: "localhost-only",
    now: new Date().toISOString(),
    pid: process.pid,
    uptime: process.uptime(),
    node: process.version,
    memoria: {
      rssMb: Number((mem.rss / 1024 / 1024).toFixed(2)),
      heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(2))
    },
    flags: {
      tokenVolume: process.env.TOKEN_VOLUME || "normal",
      whatsapp: process.env.ENABLE_WHATSAPP === "true"
    }
  });
});

module.exports = router;
