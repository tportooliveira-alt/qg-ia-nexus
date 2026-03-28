/**
 * memoryRetriever.js — Busca Inteligente de Memórias
 *
 * PROBLEMA ANTERIOR: Salvávamos no Supabase mas NUNCA puxávamos de volta.
 * Os agentes tinham amnésia total entre sessões.
 *
 * SOLUÇÃO: Este serviço busca memórias relevantes baseado em:
 *   1. Categoria (tipo de conhecimento)
 *   2. Palavras-chave do prompt do usuário
 *   3. Agente que está processando
 *   4. Recência (mais recente = mais relevante)
 *
 * O resultado é injetado no contexto do agente ANTES de chamar a IA.
 */

const MemoryService = require("./memoryService");
const EvolutionService = require("./evolutionService");

// ── Mapa de palavras-chave → categorias de memória ──────────────────────────
const KEYWORD_TO_CATEGORY = {
  // Técnico
  mcp: ["capacitacao_mcp-tools", "mcp_discovery"],
  ferramenta: ["capacitacao_mcp-tools", "capacitacao_dev-tools"],
  tool: ["capacitacao_mcp-tools", "capacitacao_dev-tools"],
  api: ["capacitacao_automation-apis", "api_integration"],
  deploy: ["capacitacao_dev-tools", "deploy_log"],
  banco: ["capacitacao_dev-tools", "database_learning"],
  supabase: ["capacitacao_dev-tools", "database_learning"],

  // IA
  agente: ["capacitacao_agent-patterns", "agent_creation"],
  llm: ["capacitacao_free-llms", "llm_discovery"],
  modelo: ["capacitacao_free-llms", "model_evaluation"],
  prompt: ["capacitacao_agent-patterns", "prompt_engineering"],
  rag: ["capacitacao_agent-patterns"],

  // Negócios
  monetiz: ["capacitacao_revenue-models", "business_strategy"],
  negocio: ["capacitacao_revenue-models", "business_strategy"],
  preco: ["capacitacao_revenue-models"],
  saas: ["capacitacao_revenue-models"],

  // Segurança
  seguranca: ["capacitacao_security-patterns"],
  vulnerabilidade: ["capacitacao_security-patterns"],

  // Projetos
  agro: ["projeto_agromacro", "gestao_pecuaria"],
  fazenda: ["projeto_agromacro", "gestao_pecuaria"],
  frigo: ["projeto_frigogest"],
  gado: ["gestao_pecuaria"],

  // Auto-aprendizado
  erro: ["auto_correcao", "error_log"],
  correcao: ["auto_correcao"],
  avaliacao: ["auto_avaliacao"],

  // Fábrica
  fabrica: ["fabrica_pipeline", "fabrica_resultado"],
  pipeline: ["fabrica_pipeline"],
};

const MemoryRetriever = {
  /**
   * Busca memórias relevantes para um prompt
   * @param {string} prompt - O prompt do usuário
   * @param {string} agente - Nome do agente que está processando
   * @param {number} maxMemories - Máximo de memórias a retornar
   * @returns {string} Texto formatado com as memórias relevantes
   */
  async buscarRelevantes(prompt, agente = "NexusClaw", maxMemories = 10) {
    const promptLower = (prompt || "").toLowerCase();
    const categoriasRelevantes = new Set();

    // 1. Mapear palavras-chave do prompt para categorias
    for (const [keyword, categories] of Object.entries(KEYWORD_TO_CATEGORY)) {
      if (promptLower.includes(keyword)) {
        categories.forEach((c) => categoriasRelevantes.add(c));
      }
    }

    // 2. Sempre incluir memórias do agente e auto-avaliação
    categoriasRelevantes.add("auto_avaliacao");
    categoriasRelevantes.add("auto_correcao");

    // 3. Buscar memórias de cada categoria relevante
    const todasMemorias = [];
    const buscas = [...categoriasRelevantes].map(async (cat) => {
      try {
        const mems = await MemoryService.listar({
          categoria: cat,
          limit: 5,
        });
        return mems;
      } catch {
        return [];
      }
    });

    const resultados = await Promise.allSettled(buscas);
    for (const r of resultados) {
      if (r.status === "fulfilled" && r.value.length > 0) {
        todasMemorias.push(...r.value);
      }
    }

    // 4. Buscar memórias específicas do agente
    try {
      const memAgent = await MemoryService.listar({
        agente,
        limit: 5,
      });
      todasMemorias.push(...memAgent);
    } catch {
      /* sem memória do agente */
    }

    // 5. Deduplicar por conteúdo
    const seen = new Set();
    const unicas = todasMemorias.filter((m) => {
      const key = (m.conteudo || "").substring(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 6. Ordenar por data (mais recente primeiro) e limitar
    unicas.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const selecionadas = unicas.slice(0, maxMemories);

    if (selecionadas.length === 0) {
      return "";
    }

    // 7. Formatar para injeção no contexto
    const linhas = selecionadas.map((m) => {
      const data = m.created_at ? new Date(m.created_at).toLocaleDateString("pt-BR") : "?";
      const cat = m.categoria || "geral";
      const conteudo = (m.conteudo || "").substring(0, 300);
      return `  [${data}] [${cat}] ${conteudo}`;
    });

    return (
      "\n\n=== MEMÓRIAS RECUPERADAS DO SUPABASE (" +
      selecionadas.length +
      " registros) ===\n" +
      "Use estas memórias para dar respostas mais precisas e evoluídas:\n" +
      linhas.join("\n") +
      "\n=== FIM DAS MEMÓRIAS ===\n"
    );
  },

  /**
   * Busca aprendizados locais (learned_facts.json) relevantes
   */
  async buscarAprendizadosLocais(prompt, limit = 5) {
    try {
      const facts = await EvolutionService.listarConhecimentos();
      if (!facts.length) return "";

      const promptLower = (prompt || "").toLowerCase();
      const palavras = promptLower
        .split(/\s+/)
        .filter((p) => p.length > 3);

      // Score de relevância simples
      const scored = facts.map((f) => {
        const texto = `${f.categoria || ""} ${f.fato || ""}`.toLowerCase();
        let score = 0;
        for (const p of palavras) {
          if (texto.includes(p)) score++;
        }
        return { ...f, score };
      });

      const relevantes = scored
        .filter((f) => f.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      if (relevantes.length === 0) return "";

      const linhas = relevantes.map(
        (f) => `  [${f.data?.split("T")[0] || "?"}] [${f.categoria}] ${(f.fato || "").substring(0, 200)}`
      );

      return (
        "\n\n=== APRENDIZADOS LOCAIS RELEVANTES (" +
        relevantes.length +
        ") ===\n" +
        linhas.join("\n") +
        "\n"
      );
    } catch {
      return "";
    }
  },

  /**
   * Busca completa: Supabase + local
   */
  async buscarTudo(prompt, agente = "NexusClaw") {
    const [supabase, local] = await Promise.allSettled([
      this.buscarRelevantes(prompt, agente),
      this.buscarAprendizadosLocais(prompt),
    ]);

    return (
      (supabase.status === "fulfilled" ? supabase.value : "") +
      (local.status === "fulfilled" ? local.value : "")
    );
  },
};

module.exports = MemoryRetriever;
