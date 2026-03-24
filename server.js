const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const fs = require("fs").promises;
const cron = require("node-cron");

// Carregar VariÃ¡veis de Ambiente
dotenv.config();

// Importar ServiÃ§os Modulares
const AIService = require("./src/services/aiService");
const NexusService = require("./src/services/nexusService");
const TerminalService = require("./src/services/terminalService");
const MySQLService = require("./src/services/mysqlService");
const FinancialService = require("./src/services/financialService");
const BackupService = require("./src/services/backupService");
const WhatsAppService = require("./src/services/whatsappService");
const ApprovalService = require("./src/services/approvalService");
const MemoryService = require("./src/services/memoryService");
const AgentRegistryService = require("./src/services/agentRegistryService");
const AuditService = require("./src/services/auditService");
const ResearchService = require("./src/services/researchService");
const EvolutionService = require("./src/services/evolutionService");
const RoutingService = require("./src/services/routingService");
const KnowledgeService = require("./src/services/knowledgeService");
const RequestValidationService = require("./src/services/requestValidationService");
const PluginManager = require("./src/plugins/pluginManager");
const { executarAgente, consultarAgente } = require("./src/services/agentService");
const { sanitizeText } = require("./src/services/sanitizer");

// ðŸ›¡ï¸ Importar Middlewares de SeguranÃ§a
const { autenticarToken, validarPath, rateLimiter } = require("./src/services/authMiddleware");

// ðŸ“ Pastas que as rotas /api/fs podem acessar (ADICIONE AS SUAS AQUI)
const PASTAS_PERMITIDAS = [
  path.resolve(__dirname), // Raiz do projeto
  path.resolve(__dirname, "src"),
  path.resolve(__dirname, "public"),
];

const app = express();
const port = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

async function atualizarEnv(chave, valor) {
  const envPath = path.join(__dirname, ".env");
  let content = await fs.readFile(envPath, "utf-8").catch(() => "");
  const linha = `${chave}=${valor}`;
  if (content.includes(`${chave}=`)) {
    content = content.replace(new RegExp(`^${chave}=.*$`, "m"), linha);
  } else {
    content = content.trimEnd() + `\n${linha}\n`;
  }
  await BackupService.criarSnapshot(envPath);
  await fs.writeFile(envPath, content, "utf-8");
}

async function safeAudit(payload) {
  try {
    await AuditService.registrar(payload);
  } catch (e) {
    console.warn("[AUDIT] Falha ao registrar:", e.message);
  }
}

// ðŸ›¡ï¸ SEGURANÃ‡A E MIDDLEWARES
app.use(cors({
  origin: [
    "https://ideiatoapp.me",
    "https://www.ideiatoapp.me",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://qg-ia-nexus.onrender.com"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-QG-Token"],
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));

// ðŸ”‘ config.js â€” gerado dinamicamente, sÃ³ acessÃ­vel via localhost
app.get('/config.js', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || '';
  const isLocal = ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1');
  if (!isLocal) return res.status(403).send('// Acesso negado');
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
window.PROVEDOR = "gemini";
window.GEMINI_API_KEY    = ${JSON.stringify(process.env.GEMINI_API_KEY || '')};
window.GROQ_API_KEY      = ${JSON.stringify(process.env.GROQ_API_KEY || '')};
window.OPENAI_API_KEY    = ${JSON.stringify(process.env.OPENAI_API_KEY || '')};
window.ANTHROPIC_API_KEY = ${JSON.stringify(process.env.ANTHROPIC_API_KEY || '')};
window.DEEPSEEK_API_KEY  = ${JSON.stringify(process.env.DEEPSEEK_API_KEY || '')};
window.CEREBRAS_API_KEY  = ${JSON.stringify(process.env.CEREBRAS_API_KEY || '')};
window.BACKEND_URL       = ${JSON.stringify(process.env.BACKEND_URL || '')};
  `.trim());
});

app.use(express.static(PUBLIC_DIR));

// ðŸ“¦ CONEXÃƒO SUPABASE (lÃª somente do .env â€” sem fallback hardcoded)
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error("âŒ SUPABASE_URL ou SUPABASE_SERVICE_KEY nÃ£o definidos no .env!");
}
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

// ðŸ”‘ ROTA: VALIDAR TOKEN (nÃ£o depende do Supabase)
app.get("/api/auth/verify", autenticarToken, (req, res) => {
  res.json({ status: "ok", autenticado: true });
});

// ROTA: STITCH MCP (Design) — PROTEGIDA
app.get("/api/stitch/:project/:screen", autenticarToken, rateLimiter(10), async (req, res) => {
  const { project, screen } = req.params;
  const formato = (req.query.format || "html").toLowerCase();
  const stitch = PluginManager.get("stitch");
  if (!stitch) return res.status(500).json({ error: "Plugin Stitch não carregado" });
  try {
    if (formato === "image") {
      const buffer = await stitch.fetchScreenImage(project, screen);
      const base64 = `data:image/png;base64,${buffer.toString("base64")}`;
      await safeAudit({ agente: "Stitch", acao: "fetch_image", status: "ok", detalhe: { project, screen }, origem: "api" });
      return res.json({ status: "Sucesso", formato: "image", base64 });
    }
    const html = await stitch.fetchScreenHtml(project, screen);
    await safeAudit({ agente: "Stitch", acao: "fetch_html", status: "ok", detalhe: { project, screen }, origem: "api" });
    res.json({ status: "Sucesso", formato: "html", html: sanitizeText(html) });
  } catch (err) {
    await safeAudit({ agente: "Stitch", acao: "fetch", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Stitch falhou: " + err.message });
  }
});

// ðŸ¤– ROTA: ORQUESTRADOR DE AGENTES (ComunicaÃ§Ã£o via App) â€” PROTEGIDA
app.post("/api/agentes/executar", autenticarToken, rateLimiter(30), async (req, res) => {
  const { agente, prompt, contexto, ordemPreferencial, taskType, taskDescription } = req.body;
  try {
    const routing = await RoutingService.getRoutingForTask(taskDescription || prompt || "", taskType || null);
    if (routing.needsClarification) {
      await safeAudit({
        agente: agente || "desconhecido",
        acao: "agente_executar_bloqueado_clarificacao",
        status: "blocked",
        detalhe: {
          domain: routing.domain,
          confidence: routing.detection?.confidence || 0
        },
        origem: "api"
      });
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
    const { resultado, iaUsada } = await AIService.chamarIAComCascata(
      promptCompleto,
      ordemPreferencial,
      false,
      null,
      taskType || null,
      taskDescription || prompt || null
    );
    await safeAudit({ agente: agente || "desconhecido", acao: "agente_executar", status: "ok", detalhe: { iaUsada }, origem: "api" });
    res.json({ status: "Sucesso", agente_ia_usada: iaUsada, resultado: sanitizeText(resultado) });
  } catch (err) {
    await safeAudit({ agente: agente || "desconhecido", acao: "agente_executar", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Efeito Cascata Falhou: " + err.message });
  }
});

// ðŸ° ROTA: NEXUS CLAW CORE (Comando Central Web) â€” PROTEGIDA
app.post("/api/nexus/comando", autenticarToken, rateLimiter(20), async (req, res) => {
  const { prompt } = req.body;
  try {
    const resposta = await NexusService.processarComando(prompt, req.body.historico || []);
    await safeAudit({ agente: "NexusClaw", acao: "nexus_comando", status: "ok", detalhe: { prompt }, origem: "api" });
    res.json({ status: "Sucesso", resposta: sanitizeText(resposta) });
  } catch (err) {
    await safeAudit({ agente: "NexusClaw", acao: "nexus_comando", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Nexus Core Falhou: " + err.message });
  }
});

// ROTA: NEXUS STREAM (SSE — resposta em tempo real token a token)
app.post("/api/nexus/stream", autenticarToken, rateLimiter(20), async (req, res) => {
  const { prompt, historico = [] } = req.body;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data) => res.write("data: " + JSON.stringify(data) + "\n\n");
  try {
    await NexusService.processarComandoStream(prompt, historico, (chunk) => send({ chunk: sanitizeText(chunk) }));
    send({ done: true });
  } catch (err) {
    send({ error: err.message });
  }
  res.end();
});

// ROTA: AGENTE AUTONOMO — resultado completo (sem stream)
app.post("/api/nexus/agente", autenticarToken, rateLimiter(5), async (req, res) => {
  const { tarefa, ferramentas } = req.body;
  if (!tarefa) return res.status(400).json({ error: "Campo 'tarefa' obrigatorio" });
  try {
    const { resultado, custo, eventos } = await consultarAgente(tarefa, { ferramentas });
    await safeAudit({ agente: "NexusAgent", acao: "agente_consulta", status: "ok", detalhe: { tarefa }, origem: "api" });
    res.json({ status: "Sucesso", resultado: sanitizeText(resultado), custo, eventos });
  } catch (err) {
    await safeAudit({ agente: "NexusAgent", acao: "agente_consulta", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Agente falhou: " + err.message });
  }
});

// ROTA: AGENTE AUTONOMO STREAM — eventos em tempo real (SSE)
app.post("/api/nexus/agente/stream", autenticarToken, rateLimiter(5), async (req, res) => {
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
      const seguro = { ...evento };
      if (typeof seguro.conteudo === "string") seguro.conteudo = sanitizeText(seguro.conteudo);
      if (typeof seguro.chunk === "string") seguro.chunk = sanitizeText(seguro.chunk);
      send(seguro);
    }
    send({ tipo: "fim" });
  } catch (err) {
    send({ tipo: "erro", conteudo: sanitizeText(err.message) });
  }
  res.end();
});

// ðŸ“‚ ROTAS: GESTÃƒO DE ARQUIVOS â€” PROTEGIDAS (Token + ValidaÃ§Ã£o de Path)
app.get("/api/fs/ler", autenticarToken, validarPath(PASTAS_PERMITIDAS), async (req, res) => {
  try {
    const content = await fs.readFile(req.pathSeguro, "utf-8");
    res.json({ content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/fs/escrever", autenticarToken, validarPath(PASTAS_PERMITIDAS), async (req, res) => {
  try {
    const { content } = req.body;
    // Criar backup antes de salvar
    await BackupService.criarSnapshot(req.pathSeguro);
    await fs.writeFile(req.pathSeguro, content, "utf-8");
    res.json({ status: "Sucesso", message: "Snapshot criado e arquivo salvo." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ðŸ­ ROTA: FÃBRICA DE SKILLS â€” PROTEGIDA (com sanitizaÃ§Ã£o de nome)
app.post("/api/skills/factory", autenticarToken, async (req, res) => {
  try {
    const { nome, papel, icone, descricao } = req.body;

    // Sanitiza o nome: sÃ³ aceita letras, nÃºmeros, - e _
    const nomeSanitizado = nome.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!nomeSanitizado || nomeSanitizado.length < 2) {
      return res.status(400).json({ error: "Nome do agente invÃ¡lido. Use apenas letras, nÃºmeros, - e _." });
    }

    const caminhoSeguro = path.join(__dirname, "src", "skills", "agentes", `${nomeSanitizado}.json`);
    const novoAgente = { nome: nomeSanitizado, icone: icone || "ðŸ¤–", papel, descricao, criado_em: new Date().toISOString() };
    await fs.writeFile(caminhoSeguro, JSON.stringify(novoAgente, null, 2), "utf-8");
    res.json({ status: "Sucesso", message: `Agente ${nomeSanitizado} fabricado!` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ðŸš€ ROTA: TERMINAL ROOT â€” PROTEGIDA (Token + Rate Limit rigoroso)
app.post("/api/terminal/exec", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const result = await TerminalService.executarComAutoHealing(req.body.command);
    await safeAudit({ agente: "NexusClaw", acao: "terminal_exec", status: result.status || "ok", detalhe: { comando: req.body.command }, origem: "api" });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// âœ… ROTA: AJUSTE DE VOLUME DE TOKENS
app.post("/api/config/token-volume", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const { volume } = req.body;
    const v = String(volume || "").toLowerCase();
    if (!["eco", "normal", "power"].includes(v)) {
      return res.status(400).json({ error: "volume invalido (eco|normal|power)" });
    }
    process.env.TOKEN_VOLUME = v;
    await atualizarEnv("TOKEN_VOLUME", v);
    await safeAudit({ agente: "NexusClaw", acao: "config_token_volume", status: "ok", detalhe: { volume: v }, origem: "api" });
    res.json({ status: "Sucesso", token_volume: v });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// âœ… FRONTEND HOSTINGER (arquivo direto)
app.get("/index_HOSTINGER.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index_HOSTINGER.html"));
});

// âœ… DASHBOARD DE CONTROLE DO NEXUS
app.get("/dashboard", (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// ðŸ” ROTA: PESQUISA AUTÃ”NOMA (disparo manual)
app.post("/api/nexus/pesquisa", autenticarToken, rateLimiter(5), async (req, res) => {
  try {
    // Executa em background sem bloquear a resposta
    res.json({ status: "Pesquisa iniciada em background. Resultados salvos no Supabase." });
    ResearchService.cicloDeEstudoIntensivo().catch(e => console.error("[PESQUISA]", e.message));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ðŸ“š ROTA: LISTAR CONHECIMENTOS APRENDIDOS
app.get("/api/nexus/conhecimentos", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const dados = await EvolutionService.listarConhecimentos();
    res.json({ status: "Sucesso", total: dados.length, conhecimentos: dados.slice(-20).reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// âœ… ROTAS: GOVERNANÃ‡A DE APROVAÃ‡Ã•ES (OpenClaw)
app.post("/api/approvals/request", autenticarToken, rateLimiter(20), async (req, res) => {
  try {
    const { agente, acao, detalhes, origem } = req.body;
    const data = await ApprovalService.solicitar({ agente, acao, detalhes, origem });
    await safeAudit({ agente: agente || "desconhecido", acao: "approval_request", status: "ok", detalhe: { acao }, origem: origem || "api" });
    res.json({ status: "Sucesso", approval: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/approvals/pending", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "50", 10);
    const data = await ApprovalService.listarPendentes(limit);
    res.json({ status: "Sucesso", approvals: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/approvals/decide", autenticarToken, rateLimiter(20), async (req, res) => {
  try {
    const { id, status, decisor, observacao } = req.body;
    if (!id || !status) {
      return res.status(400).json({ error: "id e status sao obrigatorios" });
    }
    const data = await ApprovalService.decidir({ id, status, decisor, observacao });
    await safeAudit({ agente: decisor || "Priscila", acao: "approval_decide", status: status, detalhe: { id }, origem: "api" });
    res.json({ status: "Sucesso", approval: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// âœ… ROTAS: MEMÃ“RIA PERSISTENTE (Supabase)
app.post("/api/agent/memory", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const { agente, categoria, conteudo, projeto } = req.body;
    const data = await MemoryService.registrar({ agente, categoria, conteudo, projeto });
    await safeAudit({ agente: agente || "desconhecido", acao: "memory_registrar", status: "ok", detalhe: { categoria }, origem: "api" });
    res.json({ status: "Sucesso", memoria: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/agent/memory", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const { agente, categoria, projeto, limit } = req.query;
    const data = await MemoryService.listar({
      agente,
      categoria,
      projeto,
      limit: parseInt(limit || "50", 10)
    });
    res.json({ status: "Sucesso", memorias: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// âœ… ROTAS: REGISTRO DE AGENTES
app.get("/api/agentes", autenticarToken, rateLimiter(60), async (req, res) => {
  try {
    const data = await AgentRegistryService.listarAgentes();
    res.json({ status: "Sucesso", agentes: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ðŸ“Š ROTA: MONITOR DE SAÃšDE (TELEMETRIA)
app.get("/api/status", (req, res) => {
  const mem = process.memoryUsage();
  const waAtivo = process.env.ENABLE_WHATSAPP === "true";
  res.json({
    status: "Operacional",
    agente: "NEXUS CLAW",
    uptime: process.uptime(),
    token_volume: process.env.TOKEN_VOLUME || "normal",
    memoria: {
      rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`
    },
    servicos: {
      whatsapp: waAtivo ? "Ativado" : "Desativado",
      autoHealing: "Ativado",
      multiIA: "Ativado",
      cron_pesquisa: "A cada 6h"
    }
  });
});

// ðŸ§  ROTA: DETECÃ‡ÃƒO DE DOMÃNIO DE ENGENHARIA
app.post("/api/domain-detect", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const validation = RequestValidationService.validateDomainDetectPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ error: "Payload invalido", detalhes: validation.errors });
    }
    const { taskDescription, taskType } = validation.sanitized;

    const routing = await RoutingService.getRoutingForTask(taskDescription, taskType);
    await safeAudit({
      agente: "RoutingService",
      acao: "domain_detect",
      status: "ok",
      detalhe: { domain: routing.domain, taskType },
      origem: "api"
    });

    res.json({
      status: "Sucesso",
      domain: routing.domain,
      needsClarification: routing.needsClarification,
      clarificationQuestions: routing.clarificationQuestions || [],
      routing: routing,
      agents: routing.agents || [],
      providers: routing.allProviders
    });
  } catch (err) {
    await safeAudit({
      agente: "RoutingService",
      acao: "domain_detect",
      status: "erro",
      detalhe: err.message,
      origem: "api"
    });
    res.status(500).json({ error: "DetecÃ§Ã£o de domÃ­nio falhou: " + err.message });
  }
});

// ðŸ§  ROTA: CONSULTA Ã€ BASE DE CONHECIMENTO
app.get("/api/knowledge/:domain", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const { domain } = req.params;
    const queryValidation = RequestValidationService.validateKnowledgeQuery(req.query);
    if (!queryValidation.ok) {
      return res.status(400).json({ error: "Query invalida", detalhes: queryValidation.errors });
    }
    const { category, search, maxResults } = queryValidation.sanitized;
    await KnowledgeService.ensureReady();

    let result;
    if (search) {
      result = KnowledgeService.searchKnowledge(domain, search, parseInt(maxResults || "50", 10));
    } else {
      result = KnowledgeService.getKnowledge(domain, category);
    }

    if (!result) {
      return res.status(404).json({ error: `DomÃ­nio '${domain}' ou categoria '${category}' nÃ£o encontrado` });
    }

    await safeAudit({
      agente: "KnowledgeService",
      acao: "knowledge_query",
      status: "ok",
      detalhe: { domain, category, search },
      origem: "api"
    });

    res.json({
      status: "Sucesso",
      domain,
      category,
      search: search || null,
      data: result
    });
  } catch (err) {
    await safeAudit({
      agente: "KnowledgeService",
      acao: "knowledge_query",
      status: "erro",
      detalhe: err.message,
      origem: "api"
    });
    res.status(500).json({ error: "Consulta Ã  base de conhecimento falhou: " + err.message });
  }
});

// 🧠 ROTA: RESUMO DA BASE DE CONHECIMENTO
app.get("/api/knowledge", autenticarToken, rateLimiter(30), async (req, res) => {
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ðŸ­ ROTAS: FÃBRICA DE IA (Plugin â€” proxy servidorâ†’servidor)
// Todas protegidas por X-QG-Token. A X-Chave-Fabrica fica no servidor.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const fabricaPlugin = PluginManager.get('fabricaIA');

// Flag de controle — pode ser desligada sem derrubar o servidor
let fabricaAtiva = process.env.FABRICA_ENABLED !== 'false';

// Middleware local: bloqueia rotas da Fábrica quando desligada
function verificarFabricaAtiva(req, res, next) {
  if (!fabricaAtiva) {
    return res.status(503).json({
      error: 'Fábrica de IA desligada pelo operador.',
      dica: 'Ligue novamente em POST /api/fabrica/toggle ou no Dashboard.'
    });
  }
  next();
}

// POST /api/fabrica/toggle — liga/desliga o plugin
app.post('/api/fabrica/toggle', autenticarToken, async (req, res) => {
  fabricaAtiva = !fabricaAtiva;
  fabricaPlugin.ativo = fabricaAtiva; // sincroniza com o nexusService
  await safeAudit({ agente: 'NexusClaw', acao: 'fabrica_toggle', status: fabricaAtiva ? 'ligado' : 'desligado', detalhe: {}, origem: 'api' });
  console.log('[FÁBRICA] Plugin ' + (fabricaAtiva ? '🟢 LIGADO' : '🔴 DESLIGADO'));
  res.json({ status: 'Sucesso', fabricaAtiva, mensagem: fabricaAtiva ? 'Fábrica LIGADA' : 'Fábrica DESLIGADA' });
});

// GET /api/fabrica/toggle — retorna estado atual
app.get('/api/fabrica/toggle', autenticarToken, (req, res) => {
  res.json({ fabricaAtiva });
});

// GET /api/fabrica/status â€” verifica se a FÃ¡brica estÃ¡ online
app.get("/api/fabrica/status", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const data = await fabricaPlugin.statusFabrica();
    res.json({ status: "Sucesso", fabrica: data });
  } catch (err) {
    res.status(502).json({ error: "FÃ¡brica de IA inacessÃ­vel: " + err.message });
  }
});

// POST /api/fabrica/orquestrar â€” submete ideia e inicia pipeline
app.post('/api/fabrica/orquestrar', autenticarToken, verificarFabricaAtiva, rateLimiter(10), async (req, res) => {
  const { ideia } = req.body;
  if (!ideia) return res.status(400).json({ error: "Campo 'ideia' obrigatÃ³rio" });
  try {
    const data = await fabricaPlugin.submeterIdeia(ideia);
    const pipelineId = data.pipelineId || data.id || null;
    if (pipelineId) {
      // Salva na memÃ³ria do Nexus para rastreamento
      try {
        await MemoryService.registrar({
          agente: "NexusClaw",
          categoria: "fabrica_pipeline",
          conteudo: `Pipeline ${pipelineId} iniciado: "${ideia.substring(0, 120)}"`,
          projeto: "fabrica-ia"
        });
      } catch { /* nÃ£o bloqueia se memÃ³ria falhar */ }
    }
    await safeAudit({ agente: "NexusClaw", acao: "fabrica_orquestrar", status: "ok", detalhe: { pipelineId, ideia: ideia.substring(0, 80) }, origem: "api" });
    res.json({ status: "Sucesso", pipelineId, ...data });
  } catch (err) {
    await safeAudit({ agente: "NexusClaw", acao: "fabrica_orquestrar", status: "erro", detalhe: err.message, origem: "api" });
    res.status(502).json({ error: "FÃ¡brica de IA falhou: " + err.message });
  }
});

// GET /api/fabrica/pipeline/:id/status â€” consulta status do pipeline
app.get('/api/fabrica/pipeline/:id/status', autenticarToken, verificarFabricaAtiva, rateLimiter(30), async (req, res) => {
  try {
    const data = await fabricaPlugin.statusPipeline(req.params.id);
    res.json({ status: "Sucesso", pipeline: data });
  } catch (err) {
    res.status(502).json({ error: "Erro ao consultar pipeline: " + err.message });
  }
});

// GET /api/fabrica/pipeline/:id/stream â€” proxy SSE (retransmite eventos da FÃ¡brica)
app.get('/api/fabrica/pipeline/:id/stream', autenticarToken, verificarFabricaAtiva, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const pipelineId = req.params.id;

  const streamReq = fabricaPlugin.abrirStream(
    pipelineId,
    (chunk) => {
      res.write(chunk); // retransmite eventos SSE diretamente
    },
    () => {
      res.write('data: {"tipo":"stream_encerrado"}\n\n');
      res.end();
    },
    (err) => {
      res.write(`data: {"tipo":"erro","mensagem":${JSON.stringify(err.message)}}\n\n`);
      res.end();
    }
  );

  // Se o cliente desconectar, aborta o stream upstream
  req.on('close', () => {
    if (streamReq) streamReq.destroy();
  });
});

// POST /api/fabrica/pipeline/:id/cancelar â€” cancela pipeline em execuÃ§Ã£o
app.post('/api/fabrica/pipeline/:id/cancelar', autenticarToken, verificarFabricaAtiva, rateLimiter(10), async (req, res) => {
  try {
    const data = await fabricaPlugin.cancelarPipeline(req.params.id);
    res.json({ status: "Sucesso", ...data });
  } catch (err) {
    res.status(502).json({ error: "Erro ao cancelar pipeline: " + err.message });
  }
});

// GET /api/fabrica/projetos â€” lista projetos gerados pela FÃ¡brica
app.get('/api/fabrica/projetos', autenticarToken, verificarFabricaAtiva, rateLimiter(30), async (req, res) => {
  try {
    const data = await fabricaPlugin.listarProjetos();
    res.json({ status: "Sucesso", ...data });
  } catch (err) {
    res.status(502).json({ error: "Erro ao listar projetos: " + err.message });
  }
});

// GET /api/fabrica/projetos/:id â€” detalha projeto especÃ­fico
app.get('/api/fabrica/projetos/:id', autenticarToken, verificarFabricaAtiva, rateLimiter(30), async (req, res) => {
  try {
    const data = await fabricaPlugin.buscarProjeto(req.params.id);
    res.json({ status: "Sucesso", ...data });
  } catch (err) {
    res.status(502).json({ error: "Erro ao buscar projeto: " + err.message });
  }
});

// INICIALIZAÃ‡ÃƒO
app.listen(port, async () => {
  console.log(`ðŸš€ QG IA SERVER [CALIBRAÃ‡ÃƒO INTERNA] rodando na porta ${port}`);
  console.log(`ðŸ“± Dashboard: http://localhost:${port}/dashboard`);
  
  // Ligar a Ponte de WhatsApp
  if (process.env.ENABLE_WHATSAPP === "true") {
    try {
      console.log(`ðŸ“Œ WhatsApp SERVICE: Inicializando conexÃ£o...`);
      await WhatsAppService.conectar();
    } catch (e) {
      console.log(`âŒ WhatsApp SERVICE: Falha ao iniciar ponte.`, e.message);
    }
  } else {
    console.log(`â­• WhatsApp SERVICE: Desativado (ENABLE_WHATSAPP != true).`);
  }
  
  // Ligar o Banco MySQL da Hostinger
  const hasMySQL = !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME && process.env.DB_PASS && process.env.DB_PASS !== "COLE_SUA_SENHA_MYSQL_AQUI");
  if (hasMySQL) {
    try {
      await MySQLService.inicializarTabelas();
      await FinancialService.inicializarTabelaFinanceira();
      console.log(`ðŸ’° MySQL: Conectado ao banco ${process.env.DB_NAME} e tabela financeira pronta.`);
    } catch (e) {
      console.log(`âŒ MySQL: Falha ao conectar.`, e.message);
    }
  } else {
    console.log(`â­• MySQL: Desativado (credenciais ausentes).`);
  }

  // ðŸ” CRON: PESQUISA AUTÃ”NOMA A CADA 6 HORAS
  // (evita consumo excessivo de tokens â€” pesquisa 6 temas por rodada)
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] ðŸ” Iniciando ciclo de pesquisa autÃ´noma...');
    try {
      await ResearchService.cicloDeEstudoIntensivo();
      console.log('[CRON] âœ… Ciclo de pesquisa concluÃ­do.');
    } catch (e) {
      console.error('[CRON] âŒ Falha no ciclo de pesquisa:', e.message);
    }
  });
  console.log('[CRON] ðŸ” Pesquisa autÃ´noma agendada: a cada 6 horas.');
});
