const cron = require("node-cron");
const WhatsAppService = require("./services/whatsappService");
const MySQLService = require("./services/mysqlService");
const FinancialService = require("./services/financialService");
const ResearchService = require("./services/researchService");

async function bootstrap(app, port) {
  app.listen(port, async () => {
    console.log(`🚀 QG IA SERVER rodando na porta ${port}`);
    console.log(`📱 Dashboard: http://localhost:${port}/dashboard`);

    // WhatsApp
    if (process.env.ENABLE_WHATSAPP === "true") {
      try {
        console.log("🔌 WhatsApp SERVICE: Inicializando conexão...");
        await WhatsAppService.conectar();
      } catch (e) {
        console.log("❌ WhatsApp SERVICE: Falha ao iniciar ponte.", e.message);
      }
    } else {
      console.log("⭕ WhatsApp SERVICE: Desativado (ENABLE_WHATSAPP != true).");
    }

    // MySQL
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
        console.log(`💰 MySQL: Conectado ao banco ${process.env.DB_NAME} e tabela financeira pronta.`);
      } catch (e) {
        console.log("❌ MySQL: Falha ao conectar.", e.message);
      }
    } else {
      console.log("⭕ MySQL: Desativado (credenciais ausentes).");
    }

    // Cron: pesquisa autônoma a cada 6 horas
    cron.schedule("0 */6 * * *", async () => {
      console.log("[CRON] 🔍 Iniciando ciclo de pesquisa autônoma...");
      try {
        await ResearchService.cicloDeEstudoIntensivo();
        console.log("[CRON] ✅ Ciclo de pesquisa concluído.");
      } catch (e) {
        console.error("[CRON] ❌ Falha no ciclo de pesquisa:", e.message);
      }
    });
    console.log("[CRON] 🔍 Pesquisa autônoma agendada: a cada 6 horas.");
  });
}

module.exports = bootstrap;
