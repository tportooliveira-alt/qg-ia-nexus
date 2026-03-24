const MySQLService = require('./mysqlService');

const MemoryService = {
  async registrar({ agente, categoria, conteudo, projeto }) {
    const sql = `
      INSERT INTO agent_memories (agente, categoria, conteudo, projeto)
      VALUES (?, ?, ?, ?)
    `;
    const result = await MySQLService.query(sql, [
      agente || 'sistema',
      categoria || 'geral',
      typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo || {}),
      projeto || null
    ]);
    return { id: result.insertId, agente, categoria, conteudo, projeto };
  },

  async listar({ agente, categoria, projeto, limit = 50 } = {}) {
    let sql = 'SELECT * FROM agent_memories WHERE 1=1';
    const params = [];

    if (agente)   { sql += ' AND agente = ?';    params.push(agente); }
    if (categoria){ sql += ' AND categoria = ?';  params.push(categoria); }
    if (projeto)  { sql += ' AND projeto = ?';    params.push(projeto); }

    sql += ' ORDER BY criado_em DESC LIMIT ?';
    params.push(limit);

    return await MySQLService.query(sql, params);
  }
};

module.exports = MemoryService;
