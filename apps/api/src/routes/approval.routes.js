const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const ApprovalService = require("../services/approvalService");
const safeAudit = require("../utils/safeAudit");

const router = Router();

router.post("/approvals/request", autenticarToken, rateLimiter(20), async (req, res) => {
  try {
    const { agente, acao, detalhes, origem } = req.body;
    const data = await ApprovalService.solicitar({ agente, acao, detalhes, origem });
    await safeAudit({ agente: agente || "desconhecido", acao: "approval_request", status: "ok", detalhe: { acao }, origem: origem || "api" });
    res.json({ status: "Sucesso", approval: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/approvals/pending", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "50", 10);
    const data = await ApprovalService.listarPendentes(limit);
    res.json({ status: "Sucesso", approvals: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/approvals/decide", autenticarToken, rateLimiter(20), async (req, res) => {
  try {
    const { id, status, decisor, observacao } = req.body;
    if (!id || !status) return res.status(400).json({ error: "id e status sao obrigatorios" });
    const data = await ApprovalService.decidir({ id, status, decisor, observacao });
    await safeAudit({ agente: decisor || "Thiago", acao: "approval_decide", status, detalhe: { id }, origem: "api" });
    res.json({ status: "Sucesso", approval: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
