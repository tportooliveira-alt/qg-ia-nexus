const cron = require("node-cron");
const WhatsAppService = require("./services/whatsappService");
const MySQLService = require("./services/mysqlService");
const SupabaseService = require("./services/supabaseService");
const FinancialService = require("./services/financialService");
const ResearchService = require("./services/researchService");
const ActivityService = require("./services/activityService");

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

    // ── Supabase (primário) ───────────────────────────────────────────────────
    if (SupabaseService.ativo()) {
      try {
        const ping = await SupabaseService.ping();
        if (ping.ok) {
          console.log(`✅ Supabase: Conectado (${ping.latencia_ms}ms) — armazenamento primário ativo.`);
        } else {
          console.warn(`⚠️ Supabase: Ping falhou (${ping.erro}) — usando MySQL como fallback.`);
        }
      } catch (e) {
        console.warn("⚠️ Supabase: Erro ao verificar conexão:", e.message);
      }
    } else {
      console.log("⭕ Supabase: Desativado (SUPABASE_URL ou SUPABASE_SERVICE_KEY ausentes).");
    }

    // ── MySQL (backup) ────────────────────────────────────────────────────────
    const hasMySQL = !!(
      process.env.DB_HOST &&
      process.env.DB_USER &&
      process.env.DB_NAME &&
      process.env.DB_PASS &&
      process.env.DB_PASS !== "COLE_SUA_SENHA_MYSQL_AQUI"
    );
    if (hasMySQL) {
      try {
        await MySQLService.inicializarTabelas();
        await FinancialService.inicializarTabelaFinanceira();
        const sb = SupabaseService.ativo() ? " (backup — primário é Supabase)" : " (primário)";
        console.log(`💾 MySQL: Conectado ao banco ${process.env.DB_NAME}${sb}.`);
      } catch (e) {
        console.log("❌ MySQL: Falha ao conectar.", e.message);
      }
    } else {
      console.log("⭕ MySQL: Desativado (credenciais ausentes).");
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

    console.log("[CRON] 🔍 Pesquisa autônoma: a cada 6h | 🧠 Auto-correção: a cada 12h");
  });
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

  // Busca erros recentes
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
