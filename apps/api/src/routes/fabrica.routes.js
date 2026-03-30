const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const MemoryService = require("../services/memoryService");
const SupabaseService = require("../services/supabaseService");
const MysqlService = require("../services/mysqlService");
const safeAudit = require("../utils/safeAudit");

// Fábrica de IA — módulos locais (portados do fabrica-ia-api)
const fabricaOrchestrator = require("../fabrica/fabricaOrchestrator");
const PipelineManager = require("../fabrica/core/PipelineManager");
const MasterOrchestrator = require("../fabrica/core/MasterOrchestrator");
const AgentMemory = require("../fabrica/core/AgentMemory");
const { listarProvedoresAtivos } = require("../fabrica/agents/aiService");

const router = Router();

let fabricaAtiva = process.env.FABRICA_ENABLED !== "false";

// ─── Controle Global dos Agentes ──────────────────────────────────────────────

const sistemaControle = {
  modoTeste:     process.env.MODO_TESTE    !== 'false',
  agentesAtivos: process.env.AGENTES_ATIVOS !== 'false',
  pipelinesEmExecucao: 0,
  ultimaAlteracao: new Date().toISOString()
};

function verificarFabricaAtiva(req, res, next) {
  if (!fabricaAtiva) {
    return res.status(503).json({
      error: "Fábrica de IA desligada pelo operador.",
      dica: "Ligue novamente em POST /api/fabrica/toggle ou no Dashboard."
    });
  }
  next();
}

// ─── Toggle Liga/Desliga ──────────────────────────────────────────────────────

router.post("/fabrica/toggle", autenticarToken, async (req, res) => {
  fabricaAtiva = !fabricaAtiva;
  await safeAudit({ agente: "NexusClaw", acao: "fabrica_toggle", status: fabricaAtiva ? "ligado" : "desligado", detalhe: {}, origem: "api" });
  console.log("[FÁBRICA] " + (fabricaAtiva ? "🟢 LIGADA" : "🔴 DESLIGADA"));
  res.json({ status: "Sucesso", fabricaAtiva, mensagem: fabricaAtiva ? "Fábrica LIGADA" : "Fábrica DESLIGADA" });
});

router.get("/fabrica/toggle", autenticarToken, (req, res) => {
  res.json({ fabricaAtiva });
});

// ─── Status ───────────────────────────────────────────────────────────────────

router.get("/fabrica/status", autenticarToken, rateLimiter(30), (req, res) => {
  res.json({
    status: "Online",
    message: "Fábrica de IA integrada ao QG-IA-Nexus",
    banco: MysqlService.ativo() ? "MySQL" : "Desconectado",
    versao: "4.0.0",
    fabricaAtiva,
    modo_teste: sistemaControle.modoTeste,
    agentes_ativos: sistemaControle.agentesAtivos,
    pipelines_em_execucao: sistemaControle.pipelinesEmExecucao,
    provedores: listarProvedoresAtivos()
  });
});

// ─── Controle de Agentes ──────────────────────────────────────────────────────

router.get("/fabrica/controle", autenticarToken, (req, res) => {
  res.json({
    agentes_ativos: sistemaControle.agentesAtivos,
    modo_teste: sistemaControle.modoTeste,
    pipelines_em_execucao: sistemaControle.pipelinesEmExecucao,
    ultima_alteracao: sistemaControle.ultimaAlteracao,
    provedores: listarProvedoresAtivos()
  });
});

router.post("/fabrica/controle", autenticarToken, (req, res) => {
  const { acao } = req.body;
  const acoes_validas = ['pausar', 'ligar', 'modo_teste', 'modo_producao'];
  if (!acoes_validas.includes(acao)) {
    return res.status(400).json({ error: `Ação inválida. Use: ${acoes_validas.join(', ')}` });
  }

  switch (acao) {
    case 'pausar':        sistemaControle.agentesAtivos = false; break;
    case 'ligar':         sistemaControle.agentesAtivos = true;  break;
    case 'modo_teste':    sistemaControle.modoTeste = true;      break;
    case 'modo_producao': sistemaControle.modoTeste = false;     break;
  }

  sistemaControle.ultimaAlteracao = new Date().toISOString();
  console.log(`[FÁBRICA] Controle: ${acao}`);
  res.json({ success: true, estado: sistemaControle, acao_executada: acao });
});

// ─── Orquestrar Ideia (Pipeline Simples) ──────────────────────────────────────

router.post("/fabrica/orquestrar", autenticarToken, verificarFabricaAtiva, rateLimiter(10), async (req, res) => {
  const { ideia, usuario_id = 'anonimo' } = req.body;
  if (!ideia || String(ideia).trim().length < 5) {
    return res.status(400).json({ error: "A ideia deve ter pelo menos 5 caracteres." });
  }

  if (!sistemaControle.agentesAtivos) {
    return res.status(503).json({ error: "⏸️ Agentes pausados. Use /api/fabrica/controle para ligar." });
  }

  try {
    sistemaControle.pipelinesEmExecucao++;
    const dbClient = MysqlService.ativo() ? "mysql" : null;
    const resultado = await fabricaOrchestrator.executarPipeline(ideia.trim(), dbClient, usuario_id);
    sistemaControle.pipelinesEmExecucao--;

    try {
      await MemoryService.registrar({
        agente: "NexusClaw", categoria: "fabrica_pipeline",
        conteudo: `Pipeline concluído: "${resultado.nome}" | Score: ${resultado.score_final}/100`,
        projeto: "fabrica-ia"
      });
    } catch { /* não bloqueia */ }

    await safeAudit({
      agente: "NexusClaw", acao: "fabrica_orquestrar", status: "ok",
      detalhe: { nome: resultado.nome, score: resultado.score_final, tipo: resultado.tipo },
      origem: "api"
    });

    res.json({ status: "Sucesso", resultado, modo_teste: sistemaControle.modoTeste });
  } catch (err) {
    sistemaControle.pipelinesEmExecucao = Math.max(0, sistemaControle.pipelinesEmExecucao - 1);
    await safeAudit({ agente: "NexusClaw", acao: "fabrica_orquestrar", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: err.message });
  }
});

// ─── Pipeline SSE (Tempo Real) ────────────────────────────────────────────────

router.post("/fabrica/pipeline/iniciar", autenticarToken, verificarFabricaAtiva, rateLimiter(10), (req, res) => {
  const { ideia, usuario_id = 'anonimo' } = req.body;

  if (!ideia || String(ideia).trim().length < 5) {
    return res.status(400).json({ error: "Ideia deve ter pelo menos 5 caracteres" });
  }

  if (!sistemaControle.agentesAtivos) {
    return res.status(503).json({ error: "⏸️ Agentes pausados." });
  }

  const pipelineId = `pipe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    PipelineManager.criar(pipelineId, usuario_id);
  } catch (e) {
    return res.status(503).json({ error: e.message });
  }

  // Resposta imediata com ID do pipeline
  res.json({
    pipelineId,
    stream_url: `/api/fabrica/pipeline/${pipelineId}/stream`,
    msg: 'Pipeline criado. Conecte ao stream_url para acompanhar em tempo real.'
  });

  // Executar pipeline em background
  const emit = PipelineManager.criarEmitter(pipelineId);
  sistemaControle.pipelinesEmExecucao++;

  MasterOrchestrator.executar(ideia.trim(), pipelineId, usuario_id, emit)
    .then(() => {
      sistemaControle.pipelinesEmExecucao = Math.max(0, sistemaControle.pipelinesEmExecucao - 1);
      PipelineManager.remover(pipelineId);
    })
    .catch(err => {
      sistemaControle.pipelinesEmExecucao = Math.max(0, sistemaControle.pipelinesEmExecucao - 1);
      console.error(`[Pipeline ${pipelineId}] Erro fatal:`, err.message);
      PipelineManager.remover(pipelineId);
    });
});

// Stream SSE
router.get("/fabrica/pipeline/:id/stream", (req, res) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const emitFn = (data) => { res.write(`data: ${data}\n\n`); };
  const registrado = PipelineManager.registrarEmitter(id, emitFn);

  if (!registrado) {
    res.write(`data: ${JSON.stringify({ tipo: 'pipeline_nao_encontrado', pipeline_id: id })}\n\n`);
    res.end();
    return;
  }

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); }
    catch (e) { clearInterval(heartbeat); }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    PipelineManager.removerEmitter(id, emitFn);
  });
});

// Cancelar pipeline
router.post("/fabrica/pipeline/:id/cancelar", autenticarToken, verificarFabricaAtiva, rateLimiter(10), (req, res) => {
  const cancelado = PipelineManager.cancelar(req.params.id);
  if (cancelado) {
    res.json({ success: true, msg: 'Pipeline cancelado' });
  } else {
    res.status(404).json({ error: 'Pipeline não encontrado' });
  }
});

// Status dos pipelines ativos
router.get("/fabrica/pipeline/status", autenticarToken, (req, res) => {
  res.json(PipelineManager.status());
});

// ─── CRUD: Projetos da Fábrica ────────────────────────────────────────────────

router.get("/fabrica/projetos", autenticarToken, verificarFabricaAtiva, rateLimiter(30), async (req, res) => {
  try {
    const { usuario_id, status, limit = 20 } = req.query;
    const filtros = {};
    if (usuario_id) filtros.usuario_id = usuario_id;
    if (status) filtros.status = status;
    const dados = await MysqlService.buscar('projetos_fabrica', {
      filtros, limit: parseInt(limit), orderBy: 'criado_em', ascending: false
    });
    res.json({ status: "Sucesso", projetos: dados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fabrica/projetos/:id", autenticarToken, verificarFabricaAtiva, rateLimiter(30), async (req, res) => {
  try {
    const dados = await MysqlService.buscar('projetos_fabrica', {
      filtros: { id: req.params.id }, limit: 1
    });
    if (!dados.length) return res.status(404).json({ error: 'Projeto não encontrado' });
    res.json({ status: "Sucesso", projeto: dados[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Provedores de IA ─────────────────────────────────────────────────────────

router.get("/fabrica/provedores", autenticarToken, (req, res) => {
  res.json({ provedores: listarProvedoresAtivos() });
});

// ─── EstudiosoAgent — Pesquisa de Mercado Global ──────────────────────────────

const EstudiosoAgent = require("../fabrica/agents/EstudiosoAgent");

// SSE: pesquisa ao vivo com eventos em tempo real
router.get("/fabrica/estudioso/pesquisar", autenticarToken, verificarFabricaAtiva, rateLimiter(5), (req, res) => {
  const { segmento } = req.query; // ex: ?segmento=agronegocio

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const emit = (dados) => {
    res.write(`data: ${JSON.stringify(dados)}\n\n`);
  };

  const usuario_id = req.usuario?.id || 'anonimo';

  EstudiosoAgent.executar(segmento || null, emit)
    .then(resultado => {
      emit({ tipo: 'estudioso_final', dados: resultado, progresso: 100 });
      res.write('data: [DONE]\n\n');
      res.end();
    })
    .catch(err => {
      emit({ tipo: 'erro', mensagem: err.message });
      res.write('data: [DONE]\n\n');
      res.end();
    });
});

// POST: retorna JSON direto (sem SSE) — para integração com Fábrica
router.post("/fabrica/estudioso/briefing", autenticarToken, verificarFabricaAtiva, rateLimiter(5), async (req, res) => {
  try {
    const { segmento } = req.body;
    const resultado = await EstudiosoAgent.executar(segmento || null, null);
    res.json({ status: 'Sucesso', ...resultado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
