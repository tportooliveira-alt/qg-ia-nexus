const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const ActivityService = require("../services/activityService");
const MemoryService = require("../services/memoryService");
const PluginManager = require("../plugins/pluginManager");

const router = Router();

/**
 * GET /api/agents/activity
 * Retorna snapshot de atividade em tempo real de todos os agentes
 * Consumido pelo grafo n8n do frontend (polling a cada 3s)
 */
router.get("/agents/activity", autenticarToken, rateLimiter(120), async (req, res) => {
  const snap = ActivityService.snapshot();

  // Enriquece com status da Fábrica (se disponível)
  try {
    const fabricaPlugin = PluginManager.get("fabricaIA");
    if (fabricaPlugin && fabricaPlugin.ativo) {
      const status = await fabricaPlugin.obterStatus().catch(() => null);
      if (status && status.pipelines_ativos > 0) {
        // Marca agentes da fábrica como trabalhando se há pipeline ativo
        const fabricaAtiva = status.ultimo_pipeline;
        const etapaAtual = fabricaAtiva?.etapa_atual;
        const mapa = {
          analise: "analista",
          planejamento: "comandante",
          arquitetura: "arquiteto",
          codificacao: "coder",
          auditoria: "auditor",
        };
        const noId = mapa[etapaAtual] || null;
        if (noId && !snap.ativos.includes(noId)) {
          snap.ativos.push(noId);
          snap.detalhes.push({
            agenteId: noId,
            status: "trabalhando",
            projeto: fabricaAtiva?.projeto || "Fábrica de IA",
            descricao: `Etapa: ${etapaAtual}`,
            iaUsada: null,
            desde: Date.now(),
            expira: Date.now() + 60_000,
          });
        }
      }
    }
  } catch { /* fábrica offline não quebra a rota */ }

  res.json({ status: "Sucesso", ...snap });
});

router.get("/agents/activity/history", autenticarToken, rateLimiter(120), (req, res) => {
  const { agenteId = null, limit = 200 } = req.query;
  const eventos = ActivityService.historico({ agenteId, limit });
  res.json({ status: "Sucesso", total: eventos.length, eventos });
});

router.get("/agents/activity/deep/:agenteId", autenticarToken, rateLimiter(120), async (req, res) => {
  const { agenteId } = req.params;
  const limitEventos = parseInt(req.query.limitEventos || "200", 10);
  const limitMemorias = parseInt(req.query.limitMemorias || "200", 10);

  const snap = ActivityService.snapshot();
  const atividadeAtual = (snap.detalhes || []).find((d) => d.agenteId === agenteId) || null;
  const eventos = ActivityService.historico({ agenteId, limit: limitEventos });

  // aliases para mapear nós do grafo aos nomes reais dos agentes nas memórias
  const aliases = {
    nexus: ["NexusClaw", "nexus", "nexusclaw"],
    scout: ["Scout", "scout"],
    research: ["Research", "research", "estudioso"],
    autocorr: ["AutoCorrecao", "autocorr", "autohealing"],
    fabrica: ["Fabrica", "fabrica", "NexusClaw"],
    analista: ["Analista", "analista"],
    comandante: ["Comandante", "comandante"],
    arquiteto: ["Arquiteto", "arquiteto"],
    coder: ["CoderChief", "coder", "coderchief"],
    auditor: ["Auditor", "auditor"],
    gem: ["Gemini", "gemini"],
    groq: ["Groq", "groq"],
    crbr: ["Cerebras", "cerebras"],
    sbvn: ["SambaNova", "sambanova"],
  };

  const termos = aliases[agenteId] || [agenteId];
  const memoriasRaw = await MemoryService.listar({ limit: limitMemorias }).catch(() => []);
  const memorias = (memoriasRaw || []).filter((m) => {
    const agente = String(m.agente || "").toLowerCase();
    const categoria = String(m.categoria || "").toLowerCase();
    return termos.some((t) => agente === String(t).toLowerCase() || categoria.includes(String(t).toLowerCase()));
  });

  res.json({
    status: "Sucesso",
    agenteId,
    atividadeAtual,
    eventos,
    aprendizados: memorias,
  });
});

module.exports = router;
