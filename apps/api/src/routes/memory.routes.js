const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const MemoryService = require("../services/memoryService");
const safeAudit = require("../utils/safeAudit");

const router = Router();

router.post("/agent/memory", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const { agente, categoria, conteudo, projeto } = req.body;
    const data = await MemoryService.registrar({ agente, categoria, conteudo, projeto });
    await safeAudit({ agente: agente || "desconhecido", acao: "memory_registrar", status: "ok", detalhe: { categoria }, origem: "api" });
    res.json({ status: "Sucesso", memoria: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/agent/memory", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const { agente, categoria, projeto, limit } = req.query;
    const data = await MemoryService.listar({ agente, categoria, projeto, limit: parseInt(limit || "50", 10) });
    res.json({ status: "Sucesso", memorias: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
