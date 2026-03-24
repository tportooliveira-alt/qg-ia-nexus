const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const KnowledgeService = require("../services/knowledgeService");
const RoutingService = require("../services/routingService");
const RequestValidationService = require("../services/requestValidationService");
const safeAudit = require("../utils/safeAudit");

const router = Router();

// Resumo da base de conhecimento
router.get("/knowledge", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    await KnowledgeService.ensureReady();
    res.json({
      status: "Sucesso",
      domains: KnowledgeService.getAvailableDomains(),
      summary: KnowledgeService.getKnowledgeSummary()
    });
  } catch (err) {
    res.status(500).json({ error: "Resumo da base de conhecimento falhou: " + err.message });
  }
});

// Consulta por domínio
router.get("/knowledge/:domain", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const { domain } = req.params;
    const queryValidation = RequestValidationService.validateKnowledgeQuery(req.query);
    if (!queryValidation.ok) return res.status(400).json({ error: "Query invalida", detalhes: queryValidation.errors });
    const { category, search, maxResults } = queryValidation.sanitized;
    await KnowledgeService.ensureReady();

    const result = search
      ? KnowledgeService.searchKnowledge(domain, search, parseInt(maxResults || "50", 10))
      : KnowledgeService.getKnowledge(domain, category);

    if (!result) return res.status(404).json({ error: `Domínio '${domain}' ou categoria '${category}' não encontrado` });

    await safeAudit({ agente: "KnowledgeService", acao: "knowledge_query", status: "ok", detalhe: { domain, category, search }, origem: "api" });
    res.json({ status: "Sucesso", domain, category, search: search || null, data: result });
  } catch (err) {
    await safeAudit({ agente: "KnowledgeService", acao: "knowledge_query", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Consulta à base de conhecimento falhou: " + err.message });
  }
});

// Detecção de domínio
router.post("/domain-detect", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const validation = RequestValidationService.validateDomainDetectPayload(req.body);
    if (!validation.ok) return res.status(400).json({ error: "Payload invalido", detalhes: validation.errors });
    const { taskDescription, taskType } = validation.sanitized;

    const routing = await RoutingService.getRoutingForTask(taskDescription, taskType);
    await safeAudit({ agente: "RoutingService", acao: "domain_detect", status: "ok", detalhe: { domain: routing.domain, taskType }, origem: "api" });

    res.json({
      status: "Sucesso",
      domain: routing.domain,
      needsClarification: routing.needsClarification,
      clarificationQuestions: routing.clarificationQuestions || [],
      routing,
      agents: routing.agents || [],
      providers: routing.allProviders
    });
  } catch (err) {
    await safeAudit({ agente: "RoutingService", acao: "domain_detect", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Detecção de domínio falhou: " + err.message });
  }
});

module.exports = router;
