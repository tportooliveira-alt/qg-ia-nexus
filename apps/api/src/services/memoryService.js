/**
 * memoryService.js — Memória dos agentes
 *
 * PRIORIDADE: MySQL Hostinger (DB_HOST)
 * FALLBACK: Supabase (se MySQL não estiver disponível)
 *
 * Tabela: agent_memories (id, agente, categoria, conteudo, projeto, created_at)
 */

const MysqlService = require("./mysqlService");
const SupabaseService = require("./supabaseService");

function usarMySQL() {
  return MysqlService.ativo();
}

const MemoryService = {
  async registrar({ agente, categoria, conteudo, projeto }) {
    const dados = {
      agente: agente || "sistema",
      categoria: categoria || "geral",
      conteudo: typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo || {}),
      projeto: projeto || null,
    };

    // PRIORIDADE 1: MySQL Hostinger
    if (usarMySQL()) {
      try {
        const result = await MysqlService.inserir("agent_memories", dados);
        if (result) return result;
      } catch (err) {
        console.error("[MEMORY-MYSQL] Erro ao registrar:", err.message);
      }
    }

    // FALLBACK: Supabase
    if (SupabaseService.ativo()) {
      try {
        return await SupabaseService.inserir("agent_memories", dados);
      } catch (err) {
        console.error("[MEMORY-SUPA] Erro ao registrar:", err.message);
      }
    }

    console.warn("[MEMORY] Nenhum backend disponivel — memoria descartada.");
    return null;
  },

  async listar({ agente, categoria, projeto, limit = 50 } = {}) {
    const filtros = {};
    if (agente) filtros.agente = agente;
    if (categoria) filtros.categoria = categoria;
    if (projeto) filtros.projeto = projeto;

    // PRIORIDADE 1: MySQL
    if (usarMySQL()) {
      try {
        return await MysqlService.buscar("agent_memories", {
          filtros,
          limit,
          orderBy: "created_at",
          ascending: false,
        });
      } catch (err) {
        console.error("[MEMORY-MYSQL] Erro ao listar:", err.message);
      }
    }

    // FALLBACK: Supabase
    if (SupabaseService.ativo()) {
      try {
        return await SupabaseService.buscar("agent_memories", {
          filtros,
          limit,
          orderBy: "created_at",
          ascending: false,
        });
      } catch (err) {
        console.error("[MEMORY-SUPA] Erro ao listar:", err.message);
      }
    }

    return [];
  },

  /**
   * Busca por texto (keyword search) — MySQL LIKE
   */
  async buscarPorTexto(texto, { limit = 20 } = {}) {
    if (usarMySQL()) {
      try {
        return await MysqlService.buscarPorTexto("agent_memories", texto, { limit });
      } catch (err) {
        console.error("[MEMORY-MYSQL] Erro em busca texto:", err.message);
      }
    }
    return [];
  },

  /**
   * Status do backend de memória
   */
  async status() {
    const mysqlOk = usarMySQL();
    const supaOk = SupabaseService.ativo();
    let total = 0;

    if (mysqlOk) {
      total = await MysqlService.contar("agent_memories");
    }

    return {
      backend: mysqlOk ? "MySQL Hostinger" : supaOk ? "Supabase" : "NENHUM",
      mysql: mysqlOk,
      supabase: supaOk,
      total_memorias: total,
    };
  },
};

module.exports = MemoryService;
