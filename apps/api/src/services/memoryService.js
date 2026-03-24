/**
 * memoryService.js — Memória dos agentes
 *
 * Estratégia dual-store:
 *   WRITE  → Supabase (primário, 500MB livre) + MySQL (backup assíncrono)
 *   READ   → Supabase (primário) → MySQL (fallback se Supabase falhar)
 *
 * Tabela Supabase: agent_memories (id, agente, categoria, conteudo, projeto, created_at)
 * Tabela MySQL:    agent_memories (id, agente, categoria, conteudo, projeto, criado_em)
 */

const MySQLService = require('./mysqlService');
const SupabaseService = require('./supabaseService');

function mysqlBackup(dados) {
  // Backup MySQL não-bloqueante — falha silenciosa
  const sql = `INSERT IGNORE INTO agent_memories (agente, categoria, conteudo, projeto) VALUES (?, ?, ?, ?)`;
  MySQLService.query(sql, [dados.agente, dados.categoria, dados.conteudo, dados.projeto])
    .catch(e => console.warn('[MEMORY] MySQL backup falhou:', e.message));
}

const MemoryService = {
  async registrar({ agente, categoria, conteudo, projeto }) {
    const dados = {
      agente: agente || 'sistema',
      categoria: categoria || 'geral',
      conteudo: typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo || {}),
      projeto: projeto || null,
    };

    // Supabase como primário
    if (SupabaseService.ativo()) {
      try {
        const resultado = await SupabaseService.inserir('agent_memories', dados);
        mysqlBackup(dados); // backup assíncrono
        return resultado;
      } catch (err) {
        console.warn('[MEMORY] Supabase falhou, usando MySQL direto:', err.message);
      }
    }

    // Fallback MySQL
    const sql = `INSERT INTO agent_memories (agente, categoria, conteudo, projeto) VALUES (?, ?, ?, ?)`;
    const result = await MySQLService.query(sql, [dados.agente, dados.categoria, dados.conteudo, dados.projeto]);
    return { id: result.insertId, ...dados };
  },

  async listar({ agente, categoria, projeto, limit = 50 } = {}) {
    // Supabase como primário
    if (SupabaseService.ativo()) {
      try {
        const filtros = {};
        if (agente)    filtros.agente    = agente;
        if (categoria) filtros.categoria = categoria;
        if (projeto)   filtros.projeto   = projeto;

        const dados = await SupabaseService.buscar('agent_memories', {
          filtros, limit, orderBy: 'created_at', ascending: false
        });
        if (dados.length > 0) return dados;
      } catch (err) {
        console.warn('[MEMORY] Supabase busca falhou, usando MySQL:', err.message);
      }
    }

    // Fallback MySQL
    let sql = 'SELECT * FROM agent_memories WHERE 1=1';
    const params = [];
    if (agente)    { sql += ' AND agente = ?';    params.push(agente); }
    if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
    if (projeto)   { sql += ' AND projeto = ?';   params.push(projeto); }
    sql += ' ORDER BY criado_em DESC LIMIT ?';
    params.push(limit);
    return await MySQLService.query(sql, params);
  }
};

module.exports = MemoryService;
