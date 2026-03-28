/**
 * autoCapacitationService.js — Motor de Auto-Capacitação do Nexus
 *
 * Este serviço é o coração da evolução autônoma.
 * Ele descobre, avalia e integra novas ferramentas, frameworks e padrões
 * de forma completamente autônoma, permitindo que o Nexus evolua sem
 * intervenção humana.
 *
 * Ciclos:
 * - Tool Discovery: Descobre novas ferramentas e avalia utilidade
 * - Skill Acquisition: Aprende a usar ferramentas aprovadas
 * - Self-Assessment: Avalia suas lacunas e planeja próximos aprendizados
 * - Integration Planning: Planeja como integrar novos conhecimentos
 */

const AIService = require("./aiService");
const EvolutionService = require("./evolutionService");
const MemoryService = require("./memoryService");

// Notificação WhatsApp lazy
async function notificarWhatsApp(msg) {
  try {
    const WhatsAppService = require("./whatsappService");
    const numero = (process.env.WHATSAPP_NUMERO_MESTRE || "").replace(/\D/g, "");
    if (numero && WhatsAppService._sock) {
      await WhatsAppService._sock.sendMessage(`${numero}@s.whatsapp.net`, { text: msg });
    }
  } catch { /* WhatsApp pode não estar conectado */ }
}

// ── Categorias de Capacitação ────────────────────────────────────────────────
const CAPACITATION_MODULES = [
  {
    id: "mcp-tools",
    nome: "MCP Tools Discovery",
    prompt: `Você é o módulo de descoberta de ferramentas MCP do Nexus.
Pesquise e liste as 10 MELHORES ferramentas MCP (Model Context Protocol) disponíveis em 2025-2026.
Para cada ferramenta, informe:
1) Nome e repositório (GitHub/npm)
2) O que ela faz (1 linha)
3) Como instalar (comando npx/npm)
4) Utilidade para um sistema multi-agente de IA (1-10)

FOCO EM: filesystem, browser, database, git, web scraping, APIs, WhatsApp, Supabase, email, deploy.
Retorne em formato JSON array: [{name, repo, desc, install, score}]`
  },
  {
    id: "free-llms",
    nome: "Free LLM Providers",
    prompt: `Você é o módulo de inteligência de mercado de IA do Nexus.
Liste TODOS os provedores de LLM que oferecem API GRATUITA em 2025-2026.
Para cada provedor:
1) Nome da empresa e URL da API
2) Modelos disponíveis gratuitamente
3) Limites (requests/dia, tokens/mês)
4) Como obter API key (link de cadastro)
5) Formato da API (OpenAI-compatible? custom?)

INCLUA: Google AI Studio (Gemini), Groq, Cerebras, SambaNova, Together AI, Fireworks AI, 
Mistral (Le Platforme), Cohere, HuggingFace Inference, Cloudflare Workers AI, 
NVIDIA NIM, Perplexity (se free tier), OpenRouter (free models).
Retorne formato JSON: [{provider, url, models[], limits, apiKeyUrl, format}]`
  },
  {
    id: "agent-patterns",
    nome: "Advanced Agent Patterns",
    prompt: `Você é o módulo de pesquisa científica em IA do Nexus.
Pesquise os padrões mais AVANÇADOS de agentes de IA publicados em 2025-2026:
1) ReAct (Reasoning + Acting) — melhorias recentes
2) Chain-of-Thought com verificação
3) Self-Reflection e Self-Critique
4) Tool Learning (agentes que aprendem a usar novas ferramentas)
5) Multi-Agent Debate (múltiplos agentes deliberam)
6) Skill Decomposition (divisão automática de habilidades)
7) Retrieval-Augmented Generation (RAG) otimizado
8) Memory-Augmented Agents (memória de longo prazo)

Para cada padrão:
- Resumo (2 linhas)
- Paper de referência (arXiv ID se possível)
- Como aplicar no nosso sistema multi-agente
Retorne formato estruturado.`
  },
  {
    id: "dev-tools",
    nome: "Developer Tools Intelligence",
    prompt: `Você é o módulo de ferramentas de desenvolvimento do Nexus.
Liste as 15 MELHORES ferramentas de desenvolvimento de 2025-2026 que um sistema de IA autônomo deveria conhecer:

CATEGORIAS:
- Build & Deploy: Vercel, Railway, Fly.io, Coolify, Render
- Database: Supabase, Neon, PlanetScale, Turso, Upstash
- AI Frameworks: LangChain, CrewAI, AutoGen, LlamaIndex, Haystack
- Testing: Vitest, Playwright, k6
- Monitoring: Sentry, PostHog, Grafana
- API: Hono, Elysia, tRPC

Para cada ferramenta:
1) Nome e URL
2) O que faz (1 linha)
3) Free tier? (sim/não + limites)
4) API/SDK disponível? (npm package)
5) Relevância para agentes autônomos (1-10)
Retorne formato JSON.`
  },
  {
    id: "automation-apis",
    nome: "Automation & Integration APIs",
    prompt: `Você é o módulo de automação do Nexus.
Liste as APIs e serviços de automação mais úteis para um agente de IA que precisa interagir com o mundo real:

1) WhatsApp Business API / Baileys / Evolution API
2) Email (Resend, SendGrid, Mailgun)
3) Pagamentos (Stripe, MercadoPago, Pix API)
4) SMS (Twilio, Vonage)
5) Storage (S3, R2, Supabase Storage)
6) OCR (Google Vision, Tesseract)
7) Web Scraping (Firecrawl, Crawl4AI, Puppeteer)
8) Calendário (Google Calendar API)
9) Planilhas (Google Sheets API)
10) Documentos (Google Docs, LibreOffice headless)
11) Notificações Push (Firebase FCM)
12) Geolocalização (Google Maps, OpenStreetMap)

Para cada:
- API endpoint ou npm package
- Como configurar (1-2 linhas)
- Custo (free tier?)
- Exemplo de uso em Node.js (1-2 linhas)
Retorne formato JSON.`
  },
  {
    id: "security-patterns",
    nome: "Security & Best Practices",
    prompt: `Você é o módulo de segurança do Nexus.
Analise e documente as melhores práticas de segurança para um sistema de agentes autônomos de IA em 2025-2026:

1) Sandboxing de execução de código (isolamento)
2) Rate limiting e proteção contra abuse
3) Secrets management (variáveis de ambiente)
4) Input sanitization (prompt injection prevention)
5) Logging e auditoria de ações autônomas
6) Approval gates (ações que precisam autorização humana)
7) Kill switch (parar todos agentes imediatamente)
8) Data privacy (LGPD compliance para dados processados)
9) Token budget management (evitar gastar demais em APIs)
10) Backup e disaster recovery

Para cada prática:
- O que é (1 linha)
- Por que é crítico (1 linha)
- Como implementar em Node.js (snippet 2-3 linhas)
Retorne formato estruturado.`
  },
  {
    id: "revenue-models",
    nome: "Monetization & Business Models",
    prompt: `Você é o módulo de estratégia de negócios do Nexus.
Analise modelos de monetização viáveis para um sistema multi-agente de IA:

1) SaaS por assinatura (planos, pricing)
2) Pay-per-use (por geração/pipeline)
3) Marketplace de agentes especializados
4) Consultoria automatizada (agente como consultor)
5) White-label (vender o motor de IA para outros)
6) API as a Service (expor agentes via API)
7) Freemium com features premium

Para cada modelo:
- Como funciona
- Receita estimada (MRR potential)
- Complexidade de implementação (1-10)
- Stack técnico necessário
Foco no mercado brasileiro e agronegócio.`
  }
];

const AutoCapacitationService = {
  /**
   * Executa um módulo de capacitação específico
   */
  async executarModulo(modulo) {
    console.log(`[AUTO-CAPACITAÇÃO] 🎓 Iniciando módulo: ${modulo.nome}`);
    const inicio = Date.now();

    try {
      const { resultado, iaUsada } = await AIService.chamarIAComCascata(
        modulo.prompt,
        ["Gemini", "Groq", "Cerebras", "SambaNova", "Anthropic", "OpenAI"]
      );

      // Salvar na evolução local
      await EvolutionService.registrarAprendizado(
        `capacitacao:${modulo.id}`,
        resultado,
        `Auto-Capacitação via ${iaUsada}`
      );

      // Salvar na memória persistente (Supabase)
      await MemoryService.registrar({
        agente: "AutoCapacitador",
        categoria: `capacitacao_${modulo.id}`,
        conteudo: resultado,
        projeto: "QG-IA-Nexus"
      });

      const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
      console.log(`[AUTO-CAPACITAÇÃO] ✅ ${modulo.nome} concluído em ${duracao}s via ${iaUsada}`);

      return { modulo: modulo.id, sucesso: true, iaUsada, duracao: `${duracao}s`, resultado };
    } catch (err) {
      console.error(`[AUTO-CAPACITAÇÃO] ❌ ${modulo.nome} falhou:`, err.message);
      return { modulo: modulo.id, sucesso: false, erro: err.message };
    }
  },

  /**
   * Executa o Self-Assessment — Nexus avalia suas próprias lacunas
   */
  async autoAvaliacao() {
    console.log("[AUTO-CAPACITAÇÃO] 🔍 Executando auto-avaliação...");

    // Busca memórias recentes para contexto
    const memorias = await MemoryService.listar({ agente: "AutoCapacitador", limit: 20 });
    const erros = await MemoryService.listar({ categoria: "auto_correcao", limit: 10 });

    const contextoMemorias = memorias.map(m => `- [${m.categoria}] ${(m.conteudo || "").substring(0, 100)}`).join("\n");
    const contextoErros = erros.map(e => `- ${(e.conteudo || "").substring(0, 100)}`).join("\n");

    const prompt = `Você é o módulo de auto-avaliação do Nexus Claw.
Analise o estado atual do sistema baseado nos dados abaixo e identifique:

CONHECIMENTOS ATUAIS:
${contextoMemorias || "(nenhum registro ainda)"}

ERROS RECENTES:
${contextoErros || "(nenhum erro registrado)"}

TAREFAS:
1) Liste as 5 maiores LACUNAS de conhecimento do sistema
2) Priorize quais habilidades aprender PRIMEIRO
3) Sugira 3 ações concretas de melhoria
4) Avalie o nível geral de capacitação (0-100)

Formato: JSON { lacunas: [], prioridades: [], acoes: [], nivel: number }`;

    try {
      const { resultado, iaUsada } = await AIService.chamarIAComCascata(prompt);

      await MemoryService.registrar({
        agente: "AutoCapacitador",
        categoria: "auto_avaliacao",
        conteudo: resultado,
        projeto: "QG-IA-Nexus"
      });

      console.log(`[AUTO-CAPACITAÇÃO] ✅ Auto-avaliação concluída via ${iaUsada}`);
      return resultado;
    } catch (err) {
      console.error("[AUTO-CAPACITAÇÃO] ❌ Auto-avaliação falhou:", err.message);
      return null;
    }
  },

  /**
   * Ciclo completo de auto-capacitação
   * Seleciona 2-3 módulos por ciclo para não sobrecarregar
   */
  async cicloDeCapacitacao() {
    console.log("[AUTO-CAPACITAÇÃO] 🚀 Iniciando ciclo de capacitação autônoma...");
    const inicio = Date.now();

    // Seleciona módulos com rotação (baseada na hora atual)
    const horaAtual = new Date().getHours();
    const indiceBase = Math.floor(horaAtual / 4) % CAPACITATION_MODULES.length;
    const modulosSelecionados = [];
    for (let i = 0; i < 3; i++) {
      modulosSelecionados.push(CAPACITATION_MODULES[(indiceBase + i) % CAPACITATION_MODULES.length]);
    }

    const resultados = [];
    for (const modulo of modulosSelecionados) {
      const res = await this.executarModulo(modulo);
      resultados.push(res);
      // Pausa entre módulos para respeitar rate limits
      await new Promise(resolve => setTimeout(resolve, 8000));
    }

    // Auto-avaliação ao final
    await this.autoAvaliacao();

    const duracao = ((Date.now() - inicio) / 1000 / 60).toFixed(1);
    const sucessos = resultados.filter(r => r.sucesso).length;

    console.log(`[AUTO-CAPACITAÇÃO] 🏁 Ciclo concluído em ${duracao}min — ${sucessos}/${resultados.length} módulos OK`);

    // Notifica Priscila
    const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const modulosNomes = resultados.map(r => `${r.sucesso ? "✅" : "❌"} ${r.modulo}`).join("\n");
    const msg = `🎓 *NEXUS — Auto-Capacitação Concluída*\n🕐 ${agora}\n⏱️ Duração: ${duracao}min\n📊 ${sucessos}/${resultados.length} módulos\n\n${modulosNomes}\n\n_Próximo ciclo em ~4h_`;
    await notificarWhatsApp(msg);

    return resultados;
  },

  /**
   * Lista todos os módulos disponíveis
   */
  listarModulos() {
    return CAPACITATION_MODULES.map(m => ({
      id: m.id,
      nome: m.nome
    }));
  }
};

module.exports = AutoCapacitationService;
