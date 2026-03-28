const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const AIService = require("../services/aiService");
const RoutingService = require("../services/routingService");
const AgentRegistryService = require("../services/agentRegistryService");
const safeAudit = require("../utils/safeAudit");

const router = Router();

// Orquestrador de agentes
router.post("/agentes/executar", autenticarToken, rateLimiter(30), async (req, res) => {
  const { agente, prompt, contexto, ordemPreferencial, taskType, taskDescription } = req.body;
  try {
    const routing = await RoutingService.getRoutingForTask(taskDescription || prompt || "", taskType || null);
    if (routing.needsClarification) {
      await safeAudit({ agente: agente || "desconhecido", acao: "agente_executar_bloqueado_clarificacao", status: "blocked", detalhe: { domain: routing.domain, confidence: routing.detection?.confidence || 0 }, origem: "api" });
      return res.status(422).json({
        status: "ClarificacaoNecessaria",
        needsClarification: true,
        domain: routing.domain,
        confidence: routing.detection?.confidence || 0,
        clarificationQuestions: routing.clarificationQuestions || [],
        message: "Contexto insuficiente para roteamento especializado seguro. Responda as perguntas de clarificacao."
      });
    }
    const promptCompleto = `CONTEXTO DO SISTEMA:\n${contexto || ''}\n\nTAREFA DO AGENTE (${agente}):\n${prompt}`;
    const { resultado, iaUsada } = await AIService.chamarIAComCascata(promptCompleto, ordemPreferencial, false, null, taskType || null, taskDescription || prompt || null);
    await safeAudit({ agente: agente || "desconhecido", acao: "agente_executar", status: "ok", detalhe: { iaUsada }, origem: "api" });
    res.json({ status: "Sucesso", agente_ia_usada: iaUsada, resultado });
  } catch (err) {
    await safeAudit({ agente: agente || "desconhecido", acao: "agente_executar", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Efeito Cascata Falhou: " + err.message });
  }
});

// Listar agentes registrados
router.get("/agentes", autenticarToken, rateLimiter(60), async (req, res) => {
  try {
    const data = await AgentRegistryService.listarAgentes();
    res.json({ status: "Sucesso", agentes: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Status dos agentes (dashboard usa /nexus/agents/status)
router.get("/nexus/agents/status", autenticarToken, rateLimiter(60), async (req, res) => {
  try {
    const agentes = await AgentRegistryService.listarAgentes();
    res.json({
      status: "Sucesso",
      total: agentes.length,
      online: agentes.length,
      agentes: agentes.map(a => ({
        nome: a.nome,
        dominios: a.dominios || [],
        taskTypes: a.taskType || [],
        providers: a.preferredProviders || [],
        status: "ativo"
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar agentes registrados (compatibilidade com /nexus/agents)
router.get("/nexus/agents", autenticarToken, rateLimiter(60), async (req, res) => {
  try {
    const data = await AgentRegistryService.listarAgentes();
    res.json({ status: "Sucesso", agentes: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
