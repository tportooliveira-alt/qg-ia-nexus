const fs = require("fs").promises;
const path = require("path");
const AIService = require("./aiService");
const TerminalService = require("./terminalService");
const MemoryService = require("./memoryService");
const PluginManager = require("../plugins/pluginManager");

const NexusService = {
    async carregarContextoOtimizado(prompt) {
          const kb = (file) => path.join(__dirname, "../knowledge_base", file);
          const sk = (file) => path.join(__dirname, "../skills", file);
          const p = prompt.toLowerCase();

      const biblia = await fs.readFile(kb("NEXUS_CORE_KNOWLEDGE.md"), "utf-8").catch(() => "");
          const roadmap = await fs.readFile(kb("NEXUS_MASTER_ROADMAP.md"), "utf-8").catch(() => "");
          let contextoOpcional = "";

      if (p.includes("financ") || p.includes("dinheiro") || p.includes("cfo") || p.includes("custo") || p.includes("receita") || p.includes("lucro")) {
              const fin = await fs.readFile(kb("NEXUS_FINANCE_EXPERT.md"), "utf-8").catch(() => "");
              contextoOpcional += "\nCFO FINANCEIRO:\n" + fin + "\n";
      }
          if (p.includes("tend") || p.includes("radar") || p.includes("novidade") || p.includes("tech") || p.includes("mercado")) {
                  const rad = await fs.readFile(kb("NEXUS_TECH_RADAR.md"), "utf-8").catch(() => "");
                  contextoOpcional += "\nRADAR TECH:\n" + rad + "\n";
          }
          if (p.includes("rede") || p.includes("diplomata") || p.includes("agente") || p.includes("contratar")) {
                  const red = await fs.readFile(kb("NEXUS_AGENT_NETWORK.md"), "utf-8").catch(() => "");
                  contextoOpcional += "\nREDE DIPLOMATICA:\n" + red + "\n";
          }
          if (p.includes("priscila") || p.includes("thiago") || p.includes("vida") || p.includes("preferencia")) {
                  const vid = await fs.readFile(sk("agentes/VidaDigital.json"), "utf-8").catch(() => "{}");
                  contextoOpcional += "\nCONHECIMENTO SOBRE O USUARIO: " + vid + "\n";
          }
          if (p.includes("skill") || p.includes("habilidade") || p.includes("agente") || p.includes("contratar")) {
                  const ski = await fs.readFile(sk("SkillHub.json"), "utf-8").catch(() => "{}");
                  contextoOpcional += "\nSKILL HUB: " + ski + "\n";
          }
          if (
        p.includes("fabrica") || p.includes("fábrica") || p.includes("factory") ||
        p.includes("criar app") || p.includes("gerar app") || p.includes("gerar projeto") ||
        p.includes("criar sistema") || p.includes("gerar sistema") || p.includes("construir app") ||
        p.includes("desenvolver app") || p.includes("quero um app") || p.includes("preciso de um app") ||
        p.includes("ideia para app") || p.includes("transformar ideia") || p.includes("pipeline")
      ) {
              const fab = await fs.readFile(kb("NEXUS_FABRICA_PLUGIN.md"), "utf-8").catch(() => "");
              contextoOpcional += "\nFÁBRICA DE IA (PLUGIN ATIVO):\n" + fab + "\n";
      }
      if (p.includes("agro") || p.includes("fazenda") || p.includes("rebanho") || p.includes("pasto") || p.includes("gado")) {
                  contextoOpcional += "\nCONTEXTO AGRO: O QG esta desenvolvendo AgroMacro (27 modulos PWA: rebanho, lotes, pastos, financeiro, rastreabilidade, IA consultor, KPIs) e Fazenda Cerebro (React Native, agentes paralelos, voz+foto+texto).\n";
          }
          if (p.includes("frigorifico") || p.includes("frigogest") || p.includes("abate") || p.includes("carne")) {
                  contextoOpcional += "\nCONTEXTO FRIGO: O QG esta desenvolvendo FrigoGest (React + Supabase, 16 agentes IA em 5 tiers para automacao total do processo de frigorifico).\n";
          }

      try {
              const memorias = await MemoryService.listar({ agente: "NexusClaw", limit: 15 });
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
              "7. Seja proativo: se identificar um problema ou oportunidade, mencione sem esperar ser perguntado.\n";

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

      if (resultado.includes("CMD:")) {
              const cmd = resultado.split("CMD:")[1].split("\n")[0].trim();
              const execResult = await TerminalService.executarComAutoHealing(cmd);
              if (execResult.status === "Sucesso") {
                        return "OK NEXUS [" + iaUsada + "]:\n" + resultado.split("CMD:")[0] + "\n\n[AUTO-HEALING: SUCESSO]\nSaida:\n" + execResult.stdout;
              } else {
                        return "AVISO NEXUS [" + iaUsada + "]:\n" + resultado.split("CMD:")[0] + "\n\n[ERRO]: " + execResult.msg + "\n" + (execResult.erro || "");
              }
      }

      return "OK NEXUS [" + iaUsada + "]:\n" + resultado;
    }
};

module.exports = NexusService;
