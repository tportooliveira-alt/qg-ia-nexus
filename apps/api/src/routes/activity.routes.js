const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const ActivityService = require("../services/activityService");
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

module.exports = router;
