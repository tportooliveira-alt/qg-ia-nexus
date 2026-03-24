/**
 * auditService.js — Log de auditoria do sistema
 *
 * Estratégia dual-store:
 *   WRITE  → Supabase (primário, 500MB livre) + MySQL (backup assíncrono)
 *   READ   → Supabase (primário) → MySQL (fallback se Supabase falhar)
 *
 * Tabela Supabase: audit_logs (id, agente, acao, status, detalhe, origem, alvo, created_at)
 * Tabela MySQL:    audit_logs (id, agente, acao, status, detalhe, origem, alvo, criado_em)
 */

const MySQLService = require('./mysqlService');
const SupabaseService = require('./supabaseService');

function mysqlBackup(dados) {
  const sql = `INSERT IGNORE INTO audit_logs (agente, acao, status, detalhe, origem, alvo) VALUES (?, ?, ?, ?, ?, ?)`;
  MySQLService.query(sql, [dados.agente, dados.acao, dados.status, dados.detalhe, dados.origem, dados.alvo || null])
    .catch(e => console.warn('[AUDIT] MySQL backup falhou:', e.message));
}

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

    // Supabase como primário
    if (SupabaseService.ativo()) {
      try {
        await SupabaseService.inserir('audit_logs', dados);
        mysqlBackup(dados); // backup assíncrono
        return true;
      } catch (err) {
        console.warn('[AUDIT] Supabase falhou, usando MySQL direto:', err.message);
      }
    }

    // Fallback MySQL
    const sql = `INSERT INTO audit_logs (agente, acao, status, detalhe, origem, alvo) VALUES (?, ?, ?, ?, ?, ?)`;
    await MySQLService.query(sql, [dados.agente, dados.acao, dados.status, dados.detalhe, dados.origem, dados.alvo]);
    return true;
  },

  async listar({ limit = 50, agente, acao, status } = {}) {
    // Supabase como primário
    if (SupabaseService.ativo()) {
      try {
        const filtros = {};
        if (agente) filtros.agente = agente;
        if (acao)   filtros.acao   = acao;
        if (status) filtros.status = status;

        const dados = await SupabaseService.buscar('audit_logs', {
          filtros, limit, orderBy: 'created_at', ascending: false
        });
        // Normaliza campo de timestamp para o frontend
        return dados.map(r => ({ ...r, created_at: r.created_at || r.criado_em }));
      } catch (err) {
        console.warn('[AUDIT] Supabase busca falhou, usando MySQL:', err.message);
      }
    }

    // Fallback MySQL
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (agente) { sql += ' AND agente = ?'; params.push(agente); }
    if (acao)   { sql += ' AND acao = ?';   params.push(acao); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY criado_em DESC LIMIT ?';
    params.push(limit);
    const rows = await MySQLService.query(sql, params);
    return rows.map(r => ({ ...r, created_at: r.criado_em }));
  }
};

module.exports = AuditService;
