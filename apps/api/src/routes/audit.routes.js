const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const AuditService = require("../services/auditService");

const router = Router();

router.get("/audit", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const { limit = 50, agente, acao, status } = req.query;
    const logs = await AuditService.listar({
      limit: Math.min(parseInt(limit, 10) || 50, 200),
      agente,
      acao,
      status,
    });
    res.json({ status: "Sucesso", count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: "Falha ao buscar logs: " + err.message });
  }
});

module.exports = router;
