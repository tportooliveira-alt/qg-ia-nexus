const { Router } = require("express");
const { autenticarToken } = require("../services/authMiddleware");

const router = Router();

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

module.exports = router;
