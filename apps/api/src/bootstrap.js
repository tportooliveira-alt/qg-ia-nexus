const cron = require("node-cron");
const WhatsAppService = require("./services/whatsappService");
const SupabaseService = require("./services/supabaseService");
const ResearchService = require("./services/researchService");
const ActivityService = require("./services/activityService");
const AutoCapacitationService = require("./services/autoCapacitationService");
const AgentMemory = require("./fabrica/core/AgentMemory");
const { bootstrapMcp } = require("./services/mcpBootstrap");

async function bootstrap(app, port) {
  app.listen(port, async () => {
    console.log(`🚀 QG IA SERVER rodando na porta ${port}`);
    console.log(`📱 Dashboard: http://localhost:${port}/dashboard`);

    // ── WhatsApp ──────────────────────────────────────────────────────────────
    if (process.env.ENABLE_WHATSAPP === "true") {
      try {
        console.log("🔌 WhatsApp SERVICE: Inicializando conexão...");
        await WhatsAppService.conectar();
      } catch (e) {
        console.log("❌ WhatsApp SERVICE: Falha ao iniciar.", e.message);
      }
    } else {
      console.log("⭕ WhatsApp SERVICE: Desativado (ENABLE_WHATSAPP != true).");
    }

    // ── Supabase (único backend) ──────────────────────────────────────────────
    if (SupabaseService.ativo()) {
      try {
        const ping = await SupabaseService.ping();
        if (ping.ok) {
          console.log(`✅ Supabase: Conectado (${ping.latencia_ms}ms) — banco de dados ativo.`);
          // Inicializar memória dos agentes com Supabase
          AgentMemory.inicializar(SupabaseService);
          console.log(`🧠 AgentMemory: Inicializado com Supabase — aprendizado persistente ativo.`);
        } else {
          console.error(`❌ Supabase: Ping falhou (${ping.erro}) — verifique SUPABASE_URL e SUPABASE_SERVICE_KEY.`);
        }
      } catch (e) {
        console.error("❌ Supabase: Erro ao verificar conexão:", e.message);
      }
    } else {
      console.error("❌ Supabase: DESATIVADO — SUPABASE_URL ou SUPABASE_SERVICE_KEY ausentes no .env!");
      console.error("   → O sistema NÃO funcionará sem Supabase. Configure as variáveis e reinicie.");
    }

    // ── MCP Servers (auto-registro) ──────────────────────────────────────────
    try {
      const mcpServers = await bootstrapMcp();
      console.log(`🔌 MCP: ${mcpServers.length} servidor(es) ativo(s).`);
    } catch (e) {
      console.warn(`⚠️ MCP Bootstrap falhou (não-bloqueante): ${e.message}`);
    }

    // ── Cron: pesquisa autônoma a cada 6 horas ────────────────────────────────
    cron.schedule("0 */6 * * *", async () => {
      console.log("[CRON] 🔍 Iniciando ciclo de pesquisa autônoma...");
      ActivityService.registrar("research",  { status: "trabalhando", descricao: "Ciclo de pesquisa autônoma", projeto: "QG IA Nexus" });
      ActivityService.registrar("evolution", { status: "trabalhando", descricao: "Aguardando dados do Research", projeto: "QG IA Nexus" });
      try {
        await ResearchService.cicloDeEstudoIntensivo();
        console.log("[CRON] ✅ Ciclo de pesquisa concluído.");
        ActivityService.registrar("evolution", { status: "trabalhando", descricao: "Salvando aprendizado no Supabase", projeto: "QG IA Nexus" });
        ActivityService.registrar("supabase",  { status: "trabalhando", descricao: "Gravando memórias do ciclo de pesquisa", projeto: "QG IA Nexus" });
      } catch (e) {
        console.error("[CRON] ❌ Falha no ciclo de pesquisa:", e.message);
      } finally {
        ActivityService.finalizar("research");
        setTimeout(() => { ActivityService.finalizar("evolution"); ActivityService.finalizar("supabase"); }, 5000);
      }
    });

    // ── Cron: auto-correção e evolução a cada 12 horas ───────────────────────
    cron.schedule("0 */12 * * *", async () => {
      console.log("[CRON] 🧠 Iniciando ciclo de auto-correção dos agentes...");
      ActivityService.registrar("autocorr", { status: "trabalhando", descricao: "Analisando erros e corrigindo", projeto: "QG IA Nexus" });
      try {
        await executarAutocorrecao();
        console.log("[CRON] ✅ Auto-correção concluída.");
      } catch (e) {
        console.error("[CRON] ❌ Falha na auto-correção:", e.message);
      } finally {
        ActivityService.finalizar("autocorr");
      }
    });

    // ── Cron: auto-capacitação a cada 4 horas ────────────────────────────────
    cron.schedule("30 */4 * * *", async () => {
      console.log("[CRON] 🎓 Iniciando ciclo de auto-capacitação...");
      ActivityService.registrar("capacitacao", { status: "trabalhando", descricao: "Descobrindo e aprendendo novas ferramentas", projeto: "QG IA Nexus" });
      try {
        await AutoCapacitationService.cicloDeCapacitacao();
        console.log("[CRON] ✅ Auto-capacitação concluída.");
      } catch (e) {
        console.error("[CRON] ❌ Falha na auto-capacitação:", e.message);
      } finally {
        ActivityService.finalizar("capacitacao");
      }
    });

    console.log("[CRON] 🔍 Pesquisa: 6h | 🧠 Auto-correção: 12h | 🎓 Capacitação: 4h");

    // ── Heartbeat: registra todos os agentes como monitorando ────────────────
    registrarHeartbeats();
    // Renova heartbeats a cada 20 minutos
    setInterval(registrarHeartbeats, 20 * 60 * 1000);
  });
}

function registrarHeartbeats() {
  const PROJ = "QG IA Nexus";
  ActivityService.monitorar("nexus",       { descricao: "Aguardando comandos — online 24/7", projeto: PROJ });
  ActivityService.monitorar("gem",         { descricao: "Provider principal — Gemini 2.5 Flash", projeto: PROJ });
  ActivityService.monitorar("groq",        { descricao: "Backup ultra-rápido — Llama 3.3 70B", projeto: PROJ });
  ActivityService.monitorar("crbr",        { descricao: "Fallback Cerebras — Llama 3.1 8B", projeto: PROJ });
  ActivityService.monitorar("sbvn",        { descricao: "Fallback SambaNova — Llama 3.3 70B", projeto: PROJ });
  ActivityService.monitorar("supa",        { descricao: "Banco de dados ativo — Supabase", projeto: PROJ });
  ActivityService.monitorar("scout",       { descricao: "Pronto para pesquisar na web", projeto: PROJ });
  ActivityService.monitorar("research",    { descricao: "Ciclo autônomo: próximo em ~6h", projeto: PROJ });
  ActivityService.monitorar("autocorr",    { descricao: "Monitorando logs — ciclo 12h", projeto: PROJ });
  ActivityService.monitorar("capacitacao", { descricao: "Auto-capacitação — ciclo 4h", projeto: PROJ });
  ActivityService.monitorar("fabrica",     { descricao: "Pipeline pronto — aguardando ideia", projeto: PROJ });
  ActivityService.monitorar("qgia",        { descricao: "Plataforma central — online", projeto: PROJ });
  ActivityService.monitorar("mcp",         { descricao: "MCP Client — pronto para ferramentas", projeto: PROJ });
  ActivityService.monitorar("agromacro",   { descricao: "PWA 27 módulos — em desenvolvimento", projeto: "AgroMacro" });
  ActivityService.monitorar("gestcort",    { descricao: "Gestão de gado de corte — ativo", projeto: "GestCort" });
  ActivityService.monitorar("frigogest",   { descricao: "Automação frigorífico — standby", projeto: "FrigoGest" });
  ActivityService.monitorar("hosting",     { descricao: "Consultor de hospedagem — pronto", projeto: PROJ });
}

/**
 * Ciclo de auto-correção:
 * 1. Lê os últimos erros do audit_log
 * 2. Pede para a IA analisar e sugerir melhorias
 * 3. Salva o aprendizado na memória dos agentes
 */
async function executarAutocorrecao() {
  const AuditService = require("./services/auditService");
  const MemoryService = require("./services/memoryService");
  const AIService = require("./services/aiService");

  const erros = await AuditService.listar({ status: "erro", limit: 10 });
  if (erros.length === 0) {
    console.log("[AUTO-CORRECAO] Nenhum erro recente encontrado — sistema saudável.");
    return;
  }

  const resumoErros = erros
    .map(e => `- [${e.agente}] ${e.acao}: ${e.detalhe}`)
    .join("\n");

  const prompt =
    "Você é o módulo de auto-correção do Nexus Claw.\n" +
    "Analise os seguintes erros recentes do sistema e identifique:\n" +
    "1) Padrão comum de falha\n" +
    "2) Causa raiz mais provável\n" +
    "3) Ação corretiva recomendada\n\n" +
    "ERROS RECENTES:\n" + resumoErros + "\n\n" +
    "Responda de forma concisa (máx. 150 palavras) e salve para memória interna.";

  try {
    const { resultado, iaUsada } = await AIService.chamarIAComCascata(prompt);

    await MemoryService.registrar({
      agente: "NexusClaw",
      categoria: "auto_correcao",
      conteudo: `[${iaUsada}] ${resultado}`,
      projeto: "QG-IA"
    });

    console.log(`[AUTO-CORRECAO] Análise salva via ${iaUsada}: ${erros.length} erros analisados.`);
  } catch (err) {
    console.error("[AUTO-CORRECAO] IA falhou:", err.message);
  }
}

module.exports = bootstrap;
