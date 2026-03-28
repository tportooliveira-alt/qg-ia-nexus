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

// ── Fontes científicas de alta qualidade ──────────────────────────────────────
// arXiv (preprints IA/computação), Semantic Scholar (relevância por IA),
// Papers with Code (teoria + implementação), SciELO (Brasil/LATAM).
// A IA usa essas fontes como contexto ao pesquisar temas técnicos.
const FONTES_CIENTIFICAS = `
FONTES CIENTÍFICAS DE REFERÊNCIA (use como base de conhecimento):
- arXiv.org: repositório de preprints de IA, computação e engenharia (cs.AI, cs.LG, cs.SE)
- Semantic Scholar (semanticscholar.org): artigos acadêmicos ranqueados por relevância
- Papers With Code (paperswithcode.com): artigos + código open-source implementado
- SciELO (scielo.org): artigos científicos brasileiros e latino-americanos em acesso aberto
- Hugging Face (huggingface.co/papers): papers diários de IA com datasets e modelos prontos
- ACM Digital Library: computação e arquitetura de software
- IEEE Xplore: engenharia elétrica, eletrônica e sistemas embarcados

Ao pesquisar, incorpore conceitos, tendências e insights dessas fontes quando relevantes.
`;

const ResearchService = {
  async pesquisarTendencia(tema) {
    console.log(`[PESQUISA] Iniciando varredura profunda sobre: ${tema}`);

    const prompt = `Você é o Agente de Pesquisa do Nexus Claw.
${FONTES_CIENTIFICAS}
    Sua tarefa é encontrar as informações mais atuais e avançadas sobre: ${tema}.
    FOCO: Tecnologias recém-lançadas, conceitos de engenharia de elite, insights científicos aplicáveis.
    Use o conhecimento das fontes científicas acima para enriquecer a resposta.

    FORMATO OBRIGATÓRIO:
    1) Resumo curto (máx 6 linhas)
    2) Impacto prático (máx 3 linhas)
    3) Próxima ação sugerida (1 linha)

    Retorne somente esse formato.`;

    try {
      const { resultado, iaUsada } = await AIService.chamarIAComCascata(
        prompt,
        ['Gemini', 'Groq', 'Cerebras', 'SambaNova', 'xAI', 'Anthropic', 'OpenAI']
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
      "Skills novas e úteis para agentes de IA (MCP, LangGraph, automações e integrações)",
      "Gestão de pecuária de corte: tecnologia, IoT, rastreabilidade e sistemas de gestão",
      "Ideias de app com potencial real de mercado no agronegócio brasileiro",
      "Ideias de software B2B/SaaS que resolvam dores claras em fazendas e frigoríficos",
      "Tendências em LLMs, RAG e sistemas multi-agente (papers arXiv recentes)",
      "Negócios e monetização: modelos, pricing e validação de MVPs",
      "Estratégia de produto e vantagem competitiva em software agtech"
    ];

    const resumos = [];
    for (const tema of temas) {
      const res = await this.pesquisarTendencia(tema);
      if (res) resumos.push(`📚 *${tema}*\n${res.split('\n').slice(0,3).join('\n')}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log("[ESTUDO] Ciclo de aprendizado concluído com sucesso.");

    // Avisa Thiago pelo WhatsApp com resumo dos aprendizados
    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const msg = `⚔️ *NEXUS CLAW — Ciclo de Pesquisa Concluído*\n🕐 ${agora}\n📊 ${resumos.length}/${temas.length} temas pesquisados\n\n${resumos.slice(0,2).join('\n\n---\n\n')}\n\n_Ver tudo no Dashboard: /dashboard_`;
    await notificarWhatsApp(msg);
  }
};

module.exports = ResearchService;
