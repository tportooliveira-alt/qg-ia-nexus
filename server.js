const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const fs = require("fs").promises;
const cron = require("node-cron");

// Carregar Variáveis de Ambiente
dotenv.config();

// Importar Serviços Modulares
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

// 🛡️ Importar Middlewares de Segurança
const { autenticarToken, validarPath, rateLimiter } = require("./src/services/authMiddleware");

// 📁 Pastas que as rotas /api/fs podem acessar (ADICIONE AS SUAS AQUI)
const PASTAS_PERMITIDAS = [
  path.resolve(__dirname), // Raiz do projeto
  path.resolve(__dirname, "src"),
  path.resolve(__dirname, "public"),
];

const app = express();
const port = process.env.PORT || 3000;

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

// 🛡️ SEGURANÇA E MIDDLEWARES
app.use(cors({
  origin: ["https://ideiatoapp.me", "https://www.ideiatoapp.me", "http://localhost:3000", "http://127.0.0.1:3000", "https://qg-ia-nexus.onrender.com"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-QG-Token"],
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));

// 🔒 config.js — gerado dinamicamente, só acessível via localhost
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

app.use(express.static(__dirname));

// 🧠 CONEXÃO SUPABASE (lê somente do .env — sem fallback hardcoded)
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error("⚠️ SUPABASE_URL ou SUPABASE_SERVICE_KEY não definidos no .env!");
}
const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

// 🔑 ROTA: VALIDAR TOKEN (não depende do Supabase)
app.get("/api/auth/verify", autenticarToken, (req, res) => {
  res.json({ status: "ok", autenticado: true });
});

// 🤖 ROTA: ORQUESTRADOR DE AGENTES (Comunicação via App) — PROTEGIDA
app.post("/api/agentes/executar", autenticarToken, rateLimiter(30), async (req, res) => {
  const { agente, prompt, contexto, ordemPreferencial } = req.body;
  try {
    const promptCompleto = `CONTEXTO DO SISTEMA:\n${contexto || ''}\n\nTAREFA DO AGENTE (${agente}):\n${prompt}`;
    const { resultado, iaUsada } = await AIService.chamarIAComCascata(promptCompleto, ordemPreferencial);
    await safeAudit({ agente: agente || "desconhecido", acao: "agente_executar", status: "ok", detalhe: { iaUsada }, origem: "api" });
    res.json({ status: "Sucesso", agente_ia_usada: iaUsada, resultado: resultado });
  } catch (err) {
    await safeAudit({ agente: agente || "desconhecido", acao: "agente_executar", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Efeito Cascata Falhou: " + err.message });
  }
});

// 🧠 ROTA: NEXUS CLAW CORE (Comando Central Web) — PROTEGIDA
app.post("/api/nexus/comando", autenticarToken, rateLimiter(20), async (req, res) => {
  const { prompt } = req.body;
  try {
    const resposta = await NexusService.processarComando(prompt);
    await safeAudit({ agente: "NexusClaw", acao: "nexus_comando", status: "ok", detalhe: { prompt }, origem: "api" });
    res.json({ status: "Sucesso", resposta });
  } catch (err) {
    await safeAudit({ agente: "NexusClaw", acao: "nexus_comando", status: "erro", detalhe: err.message, origem: "api" });
    res.status(500).json({ error: "Nexus Core Falhou: " + err.message });
  }
});

// 📂 ROTAS: GESTÃO DE ARQUIVOS — PROTEGIDAS (Token + Validação de Path)
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

// 🏭 ROTA: FÁBRICA DE SKILLS — PROTEGIDA (com sanitização de nome)
app.post("/api/skills/factory", autenticarToken, async (req, res) => {
  try {
    const { nome, papel, icone, descricao } = req.body;

    // Sanitiza o nome: só aceita letras, números, - e _
    const nomeSanitizado = nome.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!nomeSanitizado || nomeSanitizado.length < 2) {
      return res.status(400).json({ error: "Nome do agente inválido. Use apenas letras, números, - e _." });
    }

    const caminhoSeguro = path.join(__dirname, "src", "skills", "agentes", `${nomeSanitizado}.json`);
    const novoAgente = { nome: nomeSanitizado, icone: icone || "🤖", papel, descricao, criado_em: new Date().toISOString() };
    await fs.writeFile(caminhoSeguro, JSON.stringify(novoAgente, null, 2), "utf-8");
    res.json({ status: "Sucesso", message: `Agente ${nomeSanitizado} fabricado!` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🛠️ ROTA: TERMINAL ROOT — PROTEGIDA (Token + Rate Limit rigoroso)
app.post("/api/terminal/exec", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const result = await TerminalService.executarComAutoHealing(req.body.command);
    await safeAudit({ agente: "NexusClaw", acao: "terminal_exec", status: result.status || "ok", detalhe: { comando: req.body.command }, origem: "api" });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ✅ ROTA: AJUSTE DE VOLUME DE TOKENS
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

// ✅ FRONTEND HOSTINGER (arquivo direto)
app.get("/index_HOSTINGER.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index_HOSTINGER.html"));
});

// ✅ DASHBOARD DE CONTROLE DO NEXUS
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// 🔬 ROTA: PESQUISA AUTÔNOMA (disparo manual)
app.post("/api/nexus/pesquisa", autenticarToken, rateLimiter(5), async (req, res) => {
  try {
    // Executa em background sem bloquear a resposta
    res.json({ status: "Pesquisa iniciada em background. Resultados salvos no Supabase." });
    ResearchService.cicloDeEstudoIntensivo().catch(e => console.error("[PESQUISA]", e.message));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📚 ROTA: LISTAR CONHECIMENTOS APRENDIDOS
app.get("/api/nexus/conhecimentos", autenticarToken, rateLimiter(30), async (req, res) => {
  try {
    const dados = await EvolutionService.listarConhecimentos();
    res.json({ status: "Sucesso", total: dados.length, conhecimentos: dados.slice(-20).reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ROTAS: GOVERNANCA DE APROVACOES (OpenClaw)
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

// ✅ ROTAS: MEMORIA PERSISTENTE (Supabase)
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

// ✅ ROTAS: REGISTRO DE AGENTES
app.get("/api/agentes", autenticarToken, rateLimiter(60), async (req, res) => {
  try {
    const data = await AgentRegistryService.listarAgentes();
    res.json({ status: "Sucesso", agentes: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🩺 ROTA: MONITOR DE SAÚDE (TELEMETRIA)
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

// INICIALIZAÇÃO
app.listen(port, async () => {
  console.log(`🚀 QG IA SERVER [CALIBRAÇÃO INTERNA] rodando na porta ${port}`);
  console.log(`🖥️  Dashboard: http://localhost:${port}/dashboard`);
  
  // Ligar a Ponte de WhatsApp
  if (process.env.ENABLE_WHATSAPP === "true") {
    try {
      console.log(`🔌 WhatsApp SERVICE: Inicializando conexão...`);
      await WhatsAppService.conectar();
    } catch (e) {
      console.log(`❌ WhatsApp SERVICE: Falha ao iniciar ponte.`, e.message);
    }
  } else {
    console.log(`ℹ️ WhatsApp SERVICE: Desativado (ENABLE_WHATSAPP != true).`);
  }
  
  // Ligar o Banco MySQL da Hostinger
  const hasMySQL = !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME && process.env.DB_PASS && process.env.DB_PASS !== "COLE_SUA_SENHA_MYSQL_AQUI");
  if (hasMySQL) {
    try {
      await MySQLService.inicializarTabelas();
      await FinancialService.inicializarTabelaFinanceira();
      console.log(`💾 MySQL: Conectado ao banco ${process.env.DB_NAME} e tabela financeira pronta.`);
    } catch (e) {
      console.log(`⚠️ MySQL: Falha ao conectar.`, e.message);
    }
  } else {
    console.log(`ℹ️ MySQL: Desativado (credenciais ausentes).`);
  }

  // 🔬 CRON: PESQUISA AUTÔNOMA A CADA 6 HORAS
  // (evita consumo excessivo de tokens — pesquisa 6 temas por rodada)
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] 🔬 Iniciando ciclo de pesquisa autônoma...');
    try {
      await ResearchService.cicloDeEstudoIntensivo();
      console.log('[CRON] ✅ Ciclo de pesquisa concluído.');
    } catch (e) {
      console.error('[CRON] ❌ Falha no ciclo de pesquisa:', e.message);
    }
  });
  console.log('[CRON] 🔬 Pesquisa autônoma agendada: a cada 6 horas.');
});
