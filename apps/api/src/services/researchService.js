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
const FONTES_CIENTIFICAS = `
FONTES CIENTÍFICAS DE REFERÊNCIA (use como base de conhecimento):
- arXiv.org: repositório de preprints de IA, computação e engenharia (cs.AI, cs.LG, cs.SE)
- Semantic Scholar (semanticscholar.org): artigos acadêmicos ranqueados por relevância
- Papers With Code (paperswithcode.com): artigos + código open-source implementado
- SciELO (scielo.org): artigos científicos brasileiros e latino-americanos em acesso aberto
- Hugging Face (huggingface.co/papers): papers diários de IA com datasets e modelos prontos
- ACM Digital Library: computação e arquitetura de software
- IEEE Xplore: engenharia elétrica, eletrônica e sistemas embarcados
- GitHub Trending: repositórios em alta na comunidade de desenvolvimento
- Product Hunt: novas ferramentas e startups de tecnologia

Ao pesquisar, incorpore conceitos, tendências e insights dessas fontes quando relevantes.
`;

// ── Banco de Temas Expandido (21 temas com rotação) ──────────────────────────
const TEMAS_POOL = [
  // 🤖 IA & Multi-Agente
  "Skills novas e úteis para agentes de IA (MCP, LangGraph, CrewAI, AutoGen, automações e integrações modernas)",
  "Tendências em LLMs, RAG e sistemas multi-agente (papers arXiv recentes, benchmarks 2025-2026)",
  "Novos modelos de IA open-source (Llama 4, Mistral, Qwen, DeepSeek V3, Gemma 3) e como usar via API gratuita",
  "Prompt engineering avançado: Chain-of-Thought, Self-Consistency, Tree-of-Thought, metacognição em LLMs",
  "Function calling e tool-use em LLMs: como agentes decidem quais ferramentas usar automaticamente",

  // 🚜 Agronegócio & Pecuária
  "Gestão de pecuária de corte: tecnologia, IoT, rastreabilidade e sistemas de gestão em 2026",
  "Ideias de app com potencial real de mercado no agronegócio brasileiro",
  "Ideias de software B2B/SaaS que resolvam dores claras em fazendas e frigoríficos",
  "Agritech e precision farming: drones, sensores, IA para decisão agrícola",
  "Mercado do boi gordo e tendências de preços da arroba no Brasil 2026",

  // 💼 Negócios & Monetização
  "Negócios e monetização: modelos, pricing e validação de MVPs no Brasil",
  "Estratégia de produto e vantagem competitiva em software agtech",
  "SaaS para pequenas empresas brasileiras: dores, soluções e preços ideais",

  // 🛠️ DevOps & Ferramentas
  "Melhores ferramentas de deploy gratuitas em 2026 (Vercel, Railway, Fly.io, Coolify, Render)",
  "Bancos de dados modernos para startups (Supabase, Neon, Turso, PlanetScale, Upstash)",
  "MCP (Model Context Protocol): servidores populares e como integrar em sistemas de agentes",

  // 🔒 Segurança & Qualidade
  "Segurança em sistemas de IA autônomos: prompt injection, sandboxing, approval gates",
  "Testes automatizados com Vitest e Playwright para aplicações Node.js",

  // 🌐 Frontend & UX
  "Tendências de UI/UX 2026: glassmorphism, dark mode, micro-animações, design systems modernos",
  "React Server Components, Next.js 15 e Vite 6: o que mudou e melhores práticas",

  // 📊 Data & Analytics
  "Analytics e observabilidade para aplicações IA: PostHog, Sentry, OpenTelemetry"
];

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

  /**
   * Seleciona temas com rotação inteligente baseada no dia e hora.
   * Garante que todos os temas são cobertos ao longo dos ciclos.
   */
  selecionarTemas(quantidade = 7) {
    const agora = new Date();
    // Rotação baseada no dia do ano + hora (garante cobertura total)
    const diaDono = Math.floor((agora - new Date(agora.getFullYear(), 0, 0)) / 86400000);
    const ciclo = Math.floor(agora.getHours() / 6); // 0,1,2,3
    const offset = ((diaDono * 4) + ciclo) % TEMAS_POOL.length;

    const selecionados = [];
    for (let i = 0; i < Math.min(quantidade, TEMAS_POOL.length); i++) {
      selecionados.push(TEMAS_POOL[(offset + i) % TEMAS_POOL.length]);
    }
    return selecionados;
  },

  async cicloDeEstudoIntensivo() {
    const temas = this.selecionarTemas(7);
    console.log(`[ESTUDO] Temas selecionados para este ciclo: ${temas.length}`);

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
