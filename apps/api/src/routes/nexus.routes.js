const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const NexusService = require("../services/nexusService");
const EvolutionService = require("../services/evolutionService");
const ResearchService = require("../services/researchService");
const { executarAgente, consultarAgente } = require("../services/agentService");
const safeAudit = require("../utils/safeAudit");

const router = Router();

// Chat completo
router.post("/nexus/comando", autenticarToken, rateLimiter(20), async (req, res) => {
  const { prompt } = req.body;
  try {
    const resposta = await NexusService.processarComando(prompt, req.body.historico || []);
    await safeAudit({ agente: "NexusClaw", acao: "nexus_comando", status: "ok", detalhe: { prompt }, origem: "api" });
    res.json({ status: "Sucesso", resposta });
  } catch (err) {
    await safeAudit({ agente: "NexusClaw", acao: "nexus_comando", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Nexus Core Falhou: " + err.message });
  }
});

// Chat streaming SSE
router.post("/nexus/stream", autenticarToken, rateLimiter(20), async (req, res) => {
  const { prompt, historico = [] } = req.body;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const send = (data) => res.write("data: " + JSON.stringify(data) + "\n\n");
  try {
    await NexusService.processarComandoStream(prompt, historico, (chunk) => send({ chunk }));
    send({ done: true });
  } catch (err) {
    send({ error: err.message });
  }
  res.end();
});

// Agente autônomo (resposta completa)
router.post("/nexus/agente", autenticarToken, rateLimiter(5), async (req, res) => {
  const { tarefa, ferramentas } = req.body;
  if (!tarefa) return res.status(400).json({ error: "Campo 'tarefa' obrigatorio" });
  try {
    const { resultado, custo, eventos } = await consultarAgente(tarefa, { ferramentas });
    await safeAudit({ agente: "NexusAgent", acao: "agente_consulta", status: "ok", detalhe: { tarefa }, origem: "api" });
    res.json({ status: "Sucesso", resultado, custo, eventos });
  } catch (err) {
    await safeAudit({ agente: "NexusAgent", acao: "agente_consulta", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Agente falhou: " + err.message });
  }
});

// Agente autônomo streaming SSE
router.post("/nexus/agente/stream", autenticarToken, rateLimiter(5), async (req, res) => {
  const { tarefa, ferramentas } = req.body;
  if (!tarefa) return res.status(400).json({ error: "Campo 'tarefa' obrigatorio" });
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const send = (data) => res.write("data: " + JSON.stringify(data) + "\n\n");
  try {
    for await (const evento of executarAgente(tarefa, { ferramentas })) {
      send(evento);
    }
    send({ tipo: "fim" });
  } catch (err) {
    send({ tipo: "erro", conteudo: err.message });
  }
  res.end();
});

// Pesquisa autônoma (disparo manual)
router.post("/nexus/pesquisa", autenticarToken, rateLimiter(5), async (req, res) => {
  try {
    res.json({ status: "Pesquisa iniciada em background. Resultados salvos no Supabase." });
    ResearchService.cicloDeEstudoIntensivo().catch(e => console.error("[PESQUISA]", e.message));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar conhecimentos aprendidos
router.get("/nexus/conhecimentos", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const dados = await EvolutionService.listarConhecimentos();
    res.json({ status: "Sucesso", total: dados.length, conhecimentos: dados.slice(-20).reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
