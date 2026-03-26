/**
 * financialService.js — Registro financeiro de projetos
 *
 * Armazenamento: Supabase (único backend)
 * Tabela: transacoes_financeiras (id, projeto, tipo, valor, descricao, data_registro)
 */

const SupabaseService = require('./supabaseService');

const FinancialService = {
  async registrarTransacao(projeto, tipo, valor, descricao) {
    if (!SupabaseService.ativo()) {
      console.warn('[CFO] Supabase não configurado — transação descartada.');
      return;
    }

    try {
      await SupabaseService.inserir('transacoes_financeiras', {
        projeto, tipo, valor, descricao
      });
      console.log(`[CFO] Transação registrada: ${tipo} de R$${valor} em ${projeto}`);
    } catch (err) {
      console.error('[CFO] Erro ao registrar transação:', err.message);
    }
  },

  async gerarResumoDRE(projeto) {
    if (!SupabaseService.ativo()) {
      return { total_receita: 0, total_despesa: 0, lucro: 0 };
    }

    try {
      const dados = await SupabaseService.buscar('transacoes_financeiras', {
        filtros: { projeto }, limit: 1000, orderBy: 'data_registro', ascending: false
      });

      const total_receita = dados
        .filter(t => t.tipo === 'RECEITA')
        .reduce((sum, t) => sum + parseFloat(t.valor || 0), 0);
      const total_despesa = dados
        .filter(t => t.tipo === 'DESPESA')
        .reduce((sum, t) => sum + parseFloat(t.valor || 0), 0);

      return { total_receita, total_despesa, lucro: total_receita - total_despesa };
    } catch (err) {
      console.error('[CFO] Erro ao gerar DRE:', err.message);
      return { total_receita: 0, total_despesa: 0, lucro: 0 };
    }
  },

  // No-op: tabela criada via SUPABASE_SETUP.sql
  async inicializarTabelaFinanceira() {
    console.log('[CFO] Tabela gerenciada pelo Supabase — inicialização automática.');
  }
};

module.exports = FinancialService;