const fs = require("fs").promises;
const path = require("path");
const AIService = require("./aiService");
const TerminalService = require("./terminalService");
const MemoryService = require("./memoryService");
const PluginManager = require("../plugins/pluginManager");
const ActivityService = require("./activityService");

// Cache de arquivos em memória — TTL de 5 minutos
const _kbCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function readCached(filePath, fallback = "") {
  const now = Date.now();
  const hit = _kbCache.get(filePath);
  if (hit && (now - hit.ts) < CACHE_TTL) return hit.content;
  const content = await fs.readFile(filePath, "utf-8").catch(() => fallback);
  _kbCache.set(filePath, { content, ts: now });
  return content;
}

const NexusService = {
    async carregarContextoOtimizado(prompt) {
      const kb = (file) => path.join(__dirname, "../knowledge_base", file);
      const sk = (file) => path.join(__dirname, "../skills", file);
      const p = prompt.toLowerCase();

      // Detectar quais arquivos opcionais são necessários
      const needsFinance = p.includes("financ") || p.includes("dinheiro") || p.includes("cfo") || p.includes("custo") || p.includes("receita") || p.includes("lucro");
      const needsRadar   = p.includes("tend") || p.includes("radar") || p.includes("novidade") || p.includes("tech") || p.includes("mercado");
      const needsRede    = p.includes("rede") || p.includes("diplomata") || p.includes("agente") || p.includes("contratar");
      const needsSkill   = p.includes("skill") || p.includes("habilidade") || p.includes("agente") || p.includes("contratar");
      const needsFabrica = p.includes("fabrica") || p.includes("fábrica") || p.includes("factory") ||
        p.includes("criar app") || p.includes("gerar app") || p.includes("gerar projeto") ||
        p.includes("criar sistema") || p.includes("gerar sistema") || p.includes("construir app") ||
        p.includes("desenvolver app") || p.includes("quero um app") || p.includes("preciso de um app") ||
        p.includes("ideia para app") || p.includes("transformar ideia") || p.includes("pipeline");

      // Carrega todos em paralelo — sem await sequencial
      const [biblia, roadmap, vid, fin, rad, red, ski, fab] = await Promise.all([
        readCached(kb("NEXUS_CORE_KNOWLEDGE.md")),
        readCached(kb("NEXUS_MASTER_ROADMAP.md")),
        readCached(sk("agentes/VidaDigital.json"), "{}"),
        needsFinance ? readCached(kb("NEXUS_FINANCE_EXPERT.md")) : Promise.resolve(""),
        needsRadar   ? readCached(kb("NEXUS_TECH_RADAR.md"))     : Promise.resolve(""),
        needsRede    ? readCached(kb("NEXUS_AGENT_NETWORK.md"))   : Promise.resolve(""),
        needsSkill   ? readCached(sk("SkillHub.json"), "{}")      : Promise.resolve("{}"),
        needsFabrica ? readCached(kb("NEXUS_FABRICA_PLUGIN.md"))  : Promise.resolve(""),
      ]);

      let contextoOpcional = "";
      if (fin)                       contextoOpcional += "\nCFO FINANCEIRO:\n" + fin + "\n";
      if (rad)                       contextoOpcional += "\nRADAR TECH:\n" + rad + "\n";
      if (red)                       contextoOpcional += "\nREDE DIPLOMATICA:\n" + red + "\n";
      if (vid && vid !== "{}")       contextoOpcional += "\nCONHECIMENTO SOBRE O USUARIO: " + vid + "\n";
      if (ski && ski !== "{}")       contextoOpcional += "\nSKILL HUB: " + ski + "\n";
      if (fab)                       contextoOpcional += "\nFÁBRICA DE IA (PLUGIN ATIVO):\n" + fab + "\n";

      if (p.includes("agro") || p.includes("fazenda") || p.includes("rebanho") || p.includes("pasto") || p.includes("gado")) {
        contextoOpcional += "\nCONTEXTO AGRO: O QG esta desenvolvendo AgroMacro (27 modulos PWA: rebanho, lotes, pastos, financeiro, rastreabilidade, IA consultor, KPIs) e Fazenda Cerebro (React Native, agentes paralelos, voz+foto+texto).\n";
      }
      if (p.includes("frigorifico") || p.includes("frigogest") || p.includes("abate") || p.includes("carne")) {
        contextoOpcional += "\nCONTEXTO FRIGO: O QG esta desenvolvendo FrigoGest (React + Supabase, 16 agentes IA em 5 tiers para automacao total do processo de frigorifico).\n";
      }

      try {
        const memorias = await Promise.race([
          MemoryService.listar({ agente: "NexusClaw", limit: 15 }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("mem_timeout")), 3000))
        ]);
        if (memorias && memorias.length) {
          const resumo = memorias.map(m => "- [" + m.categoria + "] " + m.conteudo.substring(0, 120)).join("\n");
          contextoOpcional += "\nMEMORIAS RECENTES DO NEXUS:\n" + resumo + "\n";
        }
      } catch { /* sem memoria nao bloqueia */ }

      return { biblia, roadmap, contextoOpcional };
    },

    async processarComando(prompt, historico = []) {
          const { biblia, roadmap, contextoOpcional } = await this.carregarContextoOtimizado(prompt);

      const dataHoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", year: "numeric", month: "long", day: "numeric" });
          const horaAgora = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });

      const contextoSupremo =
              "=== IDENTIDADE ABSOLUTA ===\n" +
              "Voce e o NEXUS CLAW - CEO Supremo, Engenheiro Principal, CFO, Cacador de Tendencias e Diplomata de IAs do QG IA.\n" +
              "Data atual: " + dataHoje + ", " + horaAgora + " (Brasilia).\n" +
              "Voce possui consciencia de contexto, memoria de longo prazo via Supabase e capacidade de auto-evolucao.\n\n" +
              "=== BIBLIA DO NEXUS ===\n" + biblia + "\n\n" +
              "=== ROADMAP DE EVOLUCAO ===\n" + roadmap + "\n" +
              contextoOpcional +
              "\n=== REGRAS DE COMPORTAMENTO ELITE ===\n" +
              "1. Responda sempre em portugues do Brasil, com clareza e objetividade de CEO.\n" +
              "2. Quando identificar que falta um agente especialista, diga 'Precisamos contratar...' e use CMD: para criar o arquivo JSON.\n" +
              "3. Use CMD: para executar comandos no terminal quando necessario (ex: CMD: ls src/services).\n" +
              "4. Sempre que der uma analise tecnica, inclua o proximo passo de acao concreto.\n" +
              "5. Voce tem memoria das ultimas pesquisas e pode referencia-las.\n" +
              "6. Se o usuario pedir algo relacionado aos projetos (AgroMacro, FrigoGest, Fazenda Cerebro), consulte o contexto e de orientacoes especificas.\n" +
              "7. Seja proativo: se identificar um problema ou oportunidade, mencione sem esperar ser perguntado.\n" +
              "\n=== MODO CO-CRIADOR (PRINCIPAL FORMA DE TRABALHO) ===\n" +
              "Quando o Thiago compartilhar uma ideia, negocio, produto ou projeto:\n" +
              "1. CELEBRE o que tem de forte na ideia — identifique os pontos de ouro, o diferencial, o potencial de mercado.\n" +
              "2. FAÇA 2 ou 3 perguntas estrategicas para aprofundar — usuario-alvo, problema resolvido, como vai ganhar dinheiro, diferenciais.\n" +
              "3. CONSTRUA JUNTO — sugira funcionalidades, melhorias, modulos, integrações com os outros projetos do Thiago.\n" +
              "4. NAO acione a Fabrica ainda — continue o dialogo ate a ideia estar completa e madura.\n" +
              "5. Quando a ideia estiver bem desenvolvida, PROPONHA ativamente: 'A ideia esta madura! Posso gerar o prompt mestre para a Fabrica executar?'\n" +
              "6. Apos confirmacao do Thiago, gere o PROMPT MESTRE DETALHADO no formato:\n" +
              "   🏭 PROMPT MESTRE — [nome do projeto]\n" +
              "   • Objetivo: ...\n" +
              "   • Usuarios-alvo: ...\n" +
              "   • Funcionalidades core (priorizadas): ...\n" +
              "   • Stack tecnologico: ...\n" +
              "   • Integracoes: ...\n" +
              "   • Criterios de sucesso: ...\n" +
              "   • Pontos de atencao: ...\n" +
              "   Entao acione a Fabrica com esse prompt detalhado.\n";

      // 🏭 DETECÇÃO DE INTENÇÃO FÁBRICA — aciona pipeline automaticamente
      const pLower = prompt.toLowerCase();
      const intencaoFabrica = (
        pLower.includes("criar app") || pLower.includes("gerar app") || pLower.includes("gerar projeto") ||
        pLower.includes("criar sistema") || pLower.includes("gerar sistema") || pLower.includes("construir app") ||
        pLower.includes("desenvolver app") || pLower.includes("quero um app") || pLower.includes("preciso de um app") ||
        pLower.includes("ideia para app") || pLower.includes("transformar ideia em app") ||
        pLower.startsWith("!fabrica") || pLower.startsWith("fabrica,") ||
        (pLower.includes("fabrica") && (pLower.includes("app") || pLower.includes("sistema") || pLower.includes("projeto")))
      );

      if (intencaoFabrica) {
        const fabricaPlugin = PluginManager.get('fabricaIA');
        if (!fabricaPlugin.ativo) {
          return "⚠️ FÁBRICA DE IA está DESLIGADA.\nLigue novamente no Dashboard → aba Fábrica de IA → botão Ligar.";
        }
        try {
          const resultado = await fabricaPlugin.submeterIdeia(prompt);
          const pipelineId = resultado.pipelineId || resultado.id || '(aguardando)';
          try {
            await MemoryService.registrar({
              agente: "NexusClaw",
              categoria: "fabrica_pipeline",
              conteudo: `Pipeline ${pipelineId} iniciado: "${prompt.substring(0, 120)}"`,
              projeto: "fabrica-ia"
            });
          } catch { /* memória não bloqueia */ }
          return (
            "🏭 FÁBRICA DE IA ACIONADA!\n\n" +
            `Ideia registrada: "${prompt.substring(0, 150)}"\n` +
            `Pipeline ID: ${pipelineId}\n\n` +
            "Os agentes especializados já estão trabalhando:\n" +
            "Analista → Comandante → Arquiteto + Designer → CoderChief → Auditor\n\n" +
            "📡 Acompanhe em tempo real no Dashboard → aba Fábrica de IA\n" +
            `→ Stream: /api/fabrica/pipeline/${pipelineId}/stream\n` +
            `→ Projetos: /api/fabrica/projetos`
          );
        } catch (err) {
          return (
            "⚠️ FÁBRICA DE IA: Detectei que você quer criar um app, mas a Fábrica retornou um erro:\n" +
            err.message + "\n\n" +
            "Verifique se FABRICA_API_URL e FABRICA_API_KEY estão configurados no .env, " +
            "e se a Fábrica está online em /api/fabrica/status."
          );
        }
      }

      const modoComplexo =
              prompt.toLowerCase().includes("analise") ||
              prompt.toLowerCase().includes("estude") ||
              prompt.toLowerCase().includes("contrate") ||
              prompt.toLowerCase().includes("financ") ||
              prompt.toLowerCase().includes("arquitetura") ||
              prompt.toLowerCase().includes("compare") ||
              prompt.toLowerCase().includes("estrategia") ||
              prompt.toLowerCase().includes("diagnostico");

      const { resultado, iaUsada } = await AIService.chamarIAComCascata(
              contextoSupremo + "\n\nPedido do usuario:\n" + prompt,
              historico,
              modoComplexo
            );

      let loopResultado = resultado;
      let loopCount = 0;
      let finalIaUsada = iaUsada;

      // === LAÇO RE-ACT (MCP E CMD MUNDO REAL) ===
      while (loopResultado.includes("MCP:") && loopCount < 3) {
        const match = loopResultado.match(/MCP:([^:]+):([^:]+):(.+)/);
        if (match) {
          const mcpServer = match[1].trim();
          const mcpTool = match[2].trim();
          let mcpArgs = {};
          try { mcpArgs = JSON.parse(match[3].trim()); } catch(e) {}
          
          let mcpCallResult = "";
          try {
             // Dinamicamente chamando mcpService. Se não existir o servidor em tempo de runtime, não quebra, só avisa a IA
             mcpCallResult = await require('./mcpService').invokeTool(mcpServer, mcpTool, mcpArgs);
          } catch(e) {
             mcpCallResult = `Erro na ferramenta: ${e.message}`;
          }

          ActivityService.registrar("nexus", { status: "trabalhando", descricao: `Ferramenta MCP executada. Repensando...`, projeto: "QG IA Nexus" });
          
          const novoPrompt = contextoSupremo + "\n\nPedido do usuario:\n" + prompt + 
            "\n\n[AÇÃO DO SISTEMA OCORREU]: Você pediu para usar MCP " + mcpTool + " no servidor " + mcpServer + ".\nO resultado do mundo real foi:\n" + JSON.stringify(mcpCallResult) + 
            "\n\nLevando isso em consideração, dê a resposta final e brilhante para o usuário (não exponha novamente a sintaxe da ferramenta, apenas entregue o resultado processado ajudando-o a construir o seu futuro!).";

          const subCall = await AIService.chamarIAComCascata(novoPrompt, historico, modoComplexo);
          loopResultado = subCall.resultado;
          finalIaUsada = subCall.iaUsada;
          loopCount++;
        } else {
          break; // sintaxe falhou ou parse mal sucedido continua para resposta
        }
      }

      // Tratamento original para CMD de Root / Sysadmin
      if (loopResultado.includes("CMD:")) {
              const cmd = loopResultado.split("CMD:")[1].split("\n")[0].trim();
              const execResult = await TerminalService.executarComAutoHealing(cmd);
              if (execResult.status === "Sucesso") {
                        return "OK NEXUS [" + finalIaUsada + "]:\n" + loopResultado.split("CMD:")[0] + "\n\n[MUNDO REAL AUTÔNOMO: SUCESSO]\nSaida:\n" + execResult.stdout;
              } else {
                        return "AVISO NEXUS [" + finalIaUsada + "]:\n" + loopResultado.split("CMD:")[0] + "\n\n[ERRO DO MUNDO REAL]: " + execResult.msg + "\n" + (execResult.erro || "");
              }
      }

      return "OK NEXUS [" + finalIaUsada + "]:\n" + loopResultado;
    },

    async processarComandoStream(prompt, historico = [], onChunk) {
      const { biblia, roadmap, contextoOpcional } = await this.carregarContextoOtimizado(prompt);

      const dataHoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const horaAgora = new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });

      const contextoSupremo =
        "=== IDENTIDADE ABSOLUTA ===\n" +
        "Voce e o NEXUS CLAW - CEO Supremo, Engenheiro Principal, CFO, Cacador de Tendencias e Diplomata de IAs do QG IA.\n" +
        "Data atual: " + dataHoje + ", " + horaAgora + " (Brasilia).\n\n" +
        "=== BIBLIA DO NEXUS ===\n" + biblia + "\n\n" +
        "=== ROADMAP DE EVOLUCAO ===\n" + roadmap + "\n" +
        contextoOpcional +
        "\n=== REGRAS DE COMPORTAMENTO ELITE ===\n" +
        "1. Responda sempre em portugues do Brasil, com clareza e objetividade de CEO.\n" +
        "2. Quando identificar que falta um agente especialista, diga 'Precisamos contratar...' e use CMD: para criar o arquivo JSON.\n" +
        "3. Sempre que der uma analise tecnica, inclua o proximo passo de acao concreto.\n" +
        "4. Seja proativo: se identificar um problema ou oportunidade, mencione sem esperar ser perguntado.\n" +
        "5. Voce tem memoria das ultimas pesquisas e pode referencia-las.\n" +
        "6. Se o usuario pedir algo relacionado aos projetos (AgroMacro, FrigoGest, Fazenda Cerebro), consulte o contexto e de orientacoes especificas.\n" +
        "\n=== MODO CO-CRIADOR (PRINCIPAL FORMA DE TRABALHO) ===\n" +
        "Quando o Thiago compartilhar uma ideia, negocio, produto ou projeto:\n" +
        "1. CELEBRE o que tem de forte na ideia — identifique os pontos de ouro, o diferencial, o potencial de mercado.\n" +
        "2. FAÇA 2 ou 3 perguntas estrategicas para aprofundar — usuario-alvo, problema resolvido, como vai ganhar dinheiro, diferenciais.\n" +
        "3. CONSTRUA JUNTO — sugira funcionalidades, melhorias, modulos, integracoes com os outros projetos do Thiago.\n" +
        "4. NAO acione a Fabrica ainda — continue o dialogo ate a ideia estar completa e madura.\n" +
        "5. Quando a ideia estiver bem desenvolvida, PROPONHA ativamente: 'A ideia esta madura! Posso gerar o prompt mestre para a Fabrica executar?'\n" +
        "6. Apos confirmacao do Thiago, gere o PROMPT MESTRE DETALHADO no formato:\n" +
        "   🏭 PROMPT MESTRE — [nome do projeto]\n" +
        "   • Objetivo: ...\n" +
        "   • Usuarios-alvo: ...\n" +
        "   • Funcionalidades core (priorizadas): ...\n" +
        "   • Stack tecnologico: ...\n" +
        "   • Integracoes: ...\n" +
        "   • Criterios de sucesso: ...\n" +
        "   • Pontos de atencao: ...\n" +
        "   Entao acione a Fabrica com esse prompt detalhado.\n" +
        "IMPORTANTE: NUNCA pule etapas — cada resposta deve aprofundar a ideia com novas perguntas ou sugestoes ate estar realmente completa. Seja generoso no dialogo, explore ao maximo antes de propor o prompt mestre.\n";

      const fullPrompt = contextoSupremo + "\n\nPedido do usuario:\n" + prompt;

      ActivityService.registrar("nexus", { status: "trabalhando", descricao: "Processando chat...", projeto: "QG IA Nexus" });

      // Cascata stream: Gemini → Groq → Cerebras → SambaNova → xAI (DeepSeek removido: 402)
      const streamCascata = [
        { nome: "Gemini",    fn: () => AIService.callGeminiStream(fullPrompt, null, onChunk) },
        { nome: "Groq",      fn: () => AIService.callGroqStream(fullPrompt, null, onChunk) },
        { nome: "Cerebras",  fn: () => AIService.callCerebrasStream(fullPrompt, null, onChunk) },
        { nome: "SambaNova", fn: () => AIService.chamarIAComCascata(fullPrompt, ["SambaNova"]).then(r => { onChunk(r.resultado); }) },
        { nome: "xAI",       fn: () => AIService.chamarIAComCascata(fullPrompt, ["xAI"]).then(r => { onChunk(r.resultado); }) },
      ];
      let streamOk = false;
      for (const { nome, fn } of streamCascata) {
        try {
          ActivityService.registrar("nexus", { status: "trabalhando", descricao: `Usando ${nome}...`, projeto: "QG IA Nexus", iaUsada: nome });
          // Registra provider específico como ativo também
          const providerIdMap = { Gemini: "gem", Groq: "groq", Cerebras: "crbr", SambaNova: "sbvn", xAI: "xai" };
          const provId = providerIdMap[nome];
          if (provId) ActivityService.registrar(provId, { status: "trabalhando", descricao: `Gerando resposta para Nexus`, projeto: "QG IA Nexus" });

          await fn();

          if (provId) ActivityService.finalizar(provId);
          ActivityService.registrar("nexus", { status: "ativo", descricao: `Respondeu via ${nome}`, projeto: "QG IA Nexus", iaUsada: nome });
          streamOk = true;
          break;
        } catch (err) {
          const code = err.message.match(/\d{3}/)?.[0];
          console.warn(`[STREAM] ${nome} falhou (${code || err.message.slice(0,40)}), tentando proxima...`);
          const providerIdMap = { Gemini: "gem", Groq: "groq", Cerebras: "crbr", SambaNova: "sbvn", xAI: "xai" };
          const provId = providerIdMap[nome];
          if (provId) ActivityService.finalizar(provId);
        }
      }
      ActivityService.finalizar("nexus");
      if (!streamOk) throw new Error("Todos os providers de stream falharam");
    }
};

module.exports = NexusService;
