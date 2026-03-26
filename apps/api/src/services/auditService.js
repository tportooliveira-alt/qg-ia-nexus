/**
 * auditService.js — Log de auditoria do sistema
 *
 * Armazenamento: Supabase (único backend)
 * Tabela: audit_logs (id, agente, acao, status, detalhe, origem, alvo, created_at)
 */

const SupabaseService = require('./supabaseService');

const AuditService = {
  async registrar({ agente, acao, status, detalhe, origem, alvo }) {
    const dados = {
      agente: agente || 'sistema',
      acao: acao || '',
      status: status || 'ok',
      detalhe: typeof detalhe === 'string' ? detalhe : JSON.stringify(detalhe || {}),
      origem: origem || 'api',
      alvo: alvo || null,
    };

    if (!SupabaseService.ativo()) {
      console.warn('[AUDIT] Supabase não configurado — log descartado:', dados.acao);
      return false;
    }

    try {
      await SupabaseService.inserir('audit_logs', dados);
      return true;
    } catch (err) {
      console.error('[AUDIT] Erro ao registrar:', err.message);
      return false;
    }
  },

  async listar({ limit = 50, agente, acao, status } = {}) {
    if (!SupabaseService.ativo()) {
      console.warn('[AUDIT] Supabase não configurado — retornando vazio.');
      return [];
    }

    try {
      const filtros = {};
      if (agente) filtros.agente = agente;
      if (acao)   filtros.acao   = acao;
      if (status) filtros.status = status;

      const dados = await SupabaseService.buscar('audit_logs', {
        filtros, limit, orderBy: 'created_at', ascending: false
      });
      return dados.map(r => ({ ...r, created_at: r.created_at || r.criado_em }));
    } catch (err) {
      console.error('[AUDIT] Erro ao listar:', err.message);
      return [];
    }
  }
};

module.exports = AuditService;
