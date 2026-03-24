const MySQLService = require('./mysqlService');

const AuditService = {
  async registrar({ agente, acao, status, detalhe, origem, alvo }) {
    const sql = `
      INSERT INTO audit_logs (agente, acao, status, detalhe, origem, alvo)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await MySQLService.query(sql, [
      agente || 'sistema',
      acao,
      status || 'ok',
      typeof detalhe === 'string' ? detalhe : JSON.stringify(detalhe || {}),
      origem || 'api',
      alvo || null
    ]);
    return true;
  },

  async listar({ limit = 50, agente, acao, status } = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (agente) { sql += ' AND agente = ?'; params.push(agente); }
    if (acao)   { sql += ' AND acao = ?';   params.push(acao); }
    if (status) { sql += ' AND status = ?'; params.push(status); }

    sql += ' ORDER BY criado_em DESC LIMIT ?';
    params.push(limit);

    return await MySQLService.query(sql, params);
  }
};

module.exports = AuditService;
