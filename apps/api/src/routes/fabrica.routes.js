const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const PluginManager = require("../plugins/pluginManager");
const MemoryService = require("../services/memoryService");
const safeAudit = require("../utils/safeAudit");

const router = Router();
const fabricaPlugin = PluginManager.get("fabricaIA");

let fabricaAtiva = process.env.FABRICA_ENABLED !== "false";

function verificarFabricaAtiva(req, res, next) {
  if (!fabricaAtiva) {
    return res.status(503).json({
      error: "Fábrica de IA desligada pelo operador.",
      dica: "Ligue novamente em POST /api/fabrica/toggle ou no Dashboard."
    });
  }
  next();
}

// Liga/desliga
router.post("/fabrica/toggle", autenticarToken, async (req, res) => {
  fabricaAtiva = !fabricaAtiva;
  fabricaPlugin.ativo = fabricaAtiva;
  await safeAudit({ agente: "NexusClaw", acao: "fabrica_toggle", status: fabricaAtiva ? "ligado" : "desligado", detalhe: {}, origem: "api" });
  console.log("[FÁBRICA] Plugin " + (fabricaAtiva ? "🟢 LIGADO" : "🔴 DESLIGADO"));
  res.json({ status: "Sucesso", fabricaAtiva, mensagem: fabricaAtiva ? "Fábrica LIGADA" : "Fábrica DESLIGADA" });
});

router.get("/fabrica/toggle", autenticarToken, (req, res) => {
  res.json({ fabricaAtiva });
});

// Status
router.get("/fabrica/status", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const data = await fabricaPlugin.statusFabrica();
    res.json({ status: "Sucesso", fabrica: data });
  } catch (err) {
    res.status(502).json({ error: "Fábrica de IA inacessível: " + err.message });
  }
});

// Orquestrar ideia
router.post("/fabrica/orquestrar", autenticarToken, verificarFabricaAtiva, rateLimiter(10), async (req, res) => {
  const { ideia } = req.body;
  if (!ideia) return res.status(400).json({ error: "Campo 'ideia' obrigatório" });
  try {
    const data = await fabricaPlugin.submeterIdeia(ideia);
    const pipelineId = data.pipelineId || data.id || null;
    if (pipelineId) {
      try {
        await MemoryService.registrar({ agente: "NexusClaw", categoria: "fabrica_pipeline", conteudo: `Pipeline ${pipelineId} iniciado: "${ideia.substring(0, 120)}"`, projeto: "fabrica-ia" });
      } catch { /* não bloqueia */ }
    }
    await safeAudit({ agente: "NexusClaw", acao: "fabrica_orquestrar", status: "ok", detalhe: { pipelineId, ideia: ideia.substring(0, 80) }, origem: "api" });
    res.json({ status: "Sucesso", pipelineId, ...data });
  } catch (err) {
    await safeAudit({ agente: "NexusClaw", acao: "fabrica_orquestrar", status: "erro", detalhe: err.message, origem: "api" });
    res.status(502).json({ error: "Fábrica de IA falhou: " + err.message });
  }
});

// Status do pipeline
router.get("/fabrica/pipeline/:id/status", autenticarToken, verificarFabricaAtiva, rateLimiter(30), async (req, res) => {
  try {
    const data = await fabricaPlugin.statusPipeline(req.params.id);
    res.json({ status: "Sucesso", pipeline: data });
  } catch (err) {
    res.status(502).json({ error: "Erro ao consultar pipeline: " + err.message });
  }
});

// Stream SSE do pipeline
router.get("/fabrica/pipeline/:id/stream", autenticarToken, verificarFabricaAtiva, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const streamReq = fabricaPlugin.abrirStream(
    req.params.id,
    (chunk) => res.write(chunk),
    () => { res.write('data: {"tipo":"stream_encerrado"}\n\n'); res.end(); },
    (err) => { res.write(`data: {"tipo":"erro","mensagem":${JSON.stringify(err.message)}}\n\n`); res.end(); }
  );

  req.on("close", () => { if (streamReq) streamReq.destroy(); });
});

// Cancelar pipeline
router.post("/fabrica/pipeline/:id/cancelar", autenticarToken, verificarFabricaAtiva, rateLimiter(10), async (req, res) => {
  try {
    const data = await fabricaPlugin.cancelarPipeline(req.params.id);
    res.json({ status: "Sucesso", ...data });
  } catch (err) {
    res.status(502).json({ error: "Erro ao cancelar pipeline: " + err.message });
  }
});

// Listar projetos
router.get("/fabrica/projetos", autenticarToken, verificarFabricaAtiva, rateLimiter(30), async (req, res) => {
  try {
    const data = await fabricaPlugin.listarProjetos();
    res.json({ status: "Sucesso", ...data });
  } catch (err) {
    res.status(502).json({ error: "Erro ao listar projetos: " + err.message });
  }
});

// Detalhar projeto
router.get("/fabrica/projetos/:id", autenticarToken, verificarFabricaAtiva, rateLimiter(30), async (req, res) => {
  try {
    const data = await fabricaPlugin.buscarProjeto(req.params.id);
    res.json({ status: "Sucesso", ...data });
  } catch (err) {
    res.status(502).json({ error: "Erro ao buscar projeto: " + err.message });
  }
});

module.exports = router;
