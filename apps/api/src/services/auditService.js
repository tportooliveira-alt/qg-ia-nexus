/**
 * auditService.js — Log de auditoria do sistema
 *
 * Armazenamento: MySQL (Hostinger)
 * Tabela: agent_audit_log (id, agente, acao, detalhes, resultado, created_at)
 */

const MysqlService = require('./mysqlService');

const AuditService = {
  async registrar({ agente, acao, status, detalhe, origem, alvo }) {
    const dados = {
      agente: agente || 'sistema',
      acao: acao || '',
      resultado: status || 'ok',
      detalhes: typeof detalhe === 'string' ? detalhe : JSON.stringify(detalhe || {}),
    };

    if (!MysqlService.ativo()) {
      console.warn('[AUDIT] MySQL não configurado — log descartado:', dados.acao);
      return false;
    }

    try {
      await MysqlService.inserir('agent_audit_log', dados);
      return true;
    } catch (err) {
      console.error('[AUDIT] Erro ao registrar:', err.message);
      return false;
    }
  },

  async listar({ limit = 50, agente, acao, status } = {}) {
    if (!MysqlService.ativo()) {
      console.warn('[AUDIT] MySQL não configurado — retornando vazio.');
      return [];
    }

    try {
      const filtros = {};
      if (agente) filtros.agente = agente;
      if (acao)   filtros.acao   = acao;
      if (status) filtros.resultado = status;

      const dados = await MysqlService.buscar('agent_audit_log', {
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
