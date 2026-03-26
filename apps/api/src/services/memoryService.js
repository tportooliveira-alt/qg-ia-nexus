/**
 * memoryService.js — Memória dos agentes
 *
 * Armazenamento: Supabase (único backend)
 * Tabela: agent_memories (id, agente, categoria, conteudo, projeto, created_at)
 */

const SupabaseService = require('./supabaseService');

const MemoryService = {
  async registrar({ agente, categoria, conteudo, projeto }) {
    const dados = {
      agente: agente || 'sistema',
      categoria: categoria || 'geral',
      conteudo: typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo || {}),
      projeto: projeto || null,
    };

    if (!SupabaseService.ativo()) {
      console.warn('[MEMORY] Supabase não configurado — memória descartada.');
      return null;
    }

    try {
      return await SupabaseService.inserir('agent_memories', dados);
    } catch (err) {
      console.error('[MEMORY] Erro ao registrar:', err.message);
      return null;
    }
  },

  async listar({ agente, categoria, projeto, limit = 50 } = {}) {
    if (!SupabaseService.ativo()) {
      console.warn('[MEMORY] Supabase não configurado — retornando vazio.');
      return [];
    }

    try {
      const filtros = {};
      if (agente)    filtros.agente    = agente;
      if (categoria) filtros.categoria = categoria;
      if (projeto)   filtros.projeto   = projeto;

      return await SupabaseService.buscar('agent_memories', {
        filtros, limit, orderBy: 'created_at', ascending: false
      });
    } catch (err) {
      console.error('[MEMORY] Erro ao listar:', err.message);
      return [];
    }
  }
};

module.exports = MemoryService;
