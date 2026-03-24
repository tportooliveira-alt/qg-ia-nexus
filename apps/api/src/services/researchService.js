const AIService = require("./aiService");
const EvolutionService = require("./evolutionService");

// Notificação WhatsApp lazy (evita dependência circular)
async function notificarWhatsApp(msg) {
  try {
    const WhatsAppService = require("./whatsappService");
    const numero = (process.env.WHATSAPP_NUMERO_MESTRE || "").replace(/\D/g, "");
    if (numero && WhatsAppService._sock) {
      await WhatsAppService._sock.sendMessage(`${numero}@s.whatsapp.net`, { text: msg });
    }
  } catch {
    // WhatsApp pode não estar conectado — não bloqueia
  }
}

const ResearchService = {
  async pesquisarTendencia(tema) {
    console.log(`[PESQUISA] Iniciando varredura profunda sobre: ${tema}`);
    
    const prompt = `Você é o Agente de Pesquisa do Nexus Claw. 
    Sua tarefa é encontrar as informações mais atuais e avançadas sobre: ${tema}.
    FOCO: Tecnologias que acabaram de ser lançadas ou conceitos de engenharia financeira de elite.
    
    FORMATO OBRIGATÓRIO:
    1) Resumo curto (máx 6 linhas)
    2) Impacto prático (máx 3 linhas)
    3) Próxima ação sugerida (1 linha)
    
    Retorne somente esse formato.`;

    try {
      const { resultado, iaUsada } = await AIService.chamarIAComCascata(
        prompt,
        ['Gemini', 'Groq', 'Cerebras', 'DeepSeek', 'SambaNova', 'xAI', 'Anthropic', 'OpenAI']
      );
      
      await EvolutionService.registrarAprendizado(
        tema, 
        resultado, 
        `Pesquisa Autônoma via ${iaUsada}`
      );

      return resultado;
    } catch (err) {
      console.error(`[PESQUISA] Falha ao pesquisar ${tema}:`, err.message);
      return null;
    }
  },

  async cicloDeEstudoIntensivo() {
    const temas = [
      "Skills novas e úteis para agentes (MCP, automações e integrações)",
      "Ideias de app com potencial real de mercado",
      "Ideias de software B2B/SaaS que resolvam dores claras",
      "Tendências tecnológicas relevantes para o QG IA",
      "Negócios e monetização (modelos, pricing, validação)",
      "Estratégia de produto e vantagem competitiva"
    ];

    const resumos = [];
    for (const tema of temas) {
      const res = await this.pesquisarTendencia(tema);
      if (res) resumos.push(`📚 *${tema}*\n${res.split('\n').slice(0,3).join('\n')}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log("[ESTUDO] Ciclo de aprendizado concluído com sucesso.");

    // Avisa Priscila pelo WhatsApp com resumo dos aprendizados
    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const msg = `⚔️ *NEXUS CLAW — Ciclo de Pesquisa Concluído*\n🕐 ${agora}\n📊 ${resumos.length}/${temas.length} temas pesquisados\n\n${resumos.slice(0,2).join('\n\n---\n\n')}\n\n_Ver tudo no Dashboard: /dashboard_`;
    await notificarWhatsApp(msg);
  }
};

module.exports = ResearchService;
