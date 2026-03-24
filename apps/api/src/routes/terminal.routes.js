const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const TerminalService = require("../services/terminalService");
const safeAudit = require("../utils/safeAudit");

const router = Router();

router.post("/terminal/exec", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const result = await TerminalService.executarComAutoHealing(req.body.command);
    await safeAudit({ agente: "NexusClaw", acao: "terminal_exec", status: result.status || "ok", detalhe: { comando: req.body.command }, origem: "api" });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
