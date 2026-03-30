/**
 * mysqlService.js — Conexão MySQL Hostinger
 *
 * Centraliza toda conexão com o banco MySQL da Hostinger.
 * Pool de conexões com auto-reconnect.
 * Cria tabelas automaticamente no primeiro uso.
 */

const mysql = require("mysql2/promise");

let pool = null;

function getPool() {
  if (pool) return pool;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;
  const password = process.env.DB_PASS;

  if (!host || !user || !database) {
    console.warn("[MYSQL] Variáveis DB_HOST/DB_USER/DB_NAME ausentes — MySQL desativado.");
    return null;
  }

  pool = mysql.createPool({
    host,
    user,
    database,
    password: password || "",
    port: parseInt(process.env.DB_PORT || "3306"),
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });

  console.log(`[MYSQL] Pool criado -> ${host}/${database}`);
  return pool;
}

/**
 * Cria as tabelas necessárias se não existirem
 */
async function initTables() {
  const p = getPool();
  if (!p) return false;

  try {
    await p.execute(`
      CREATE TABLE IF NOT EXISTS agent_memories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agente VARCHAR(100) NOT NULL DEFAULT 'sistema',
        categoria VARCHAR(100) NOT NULL DEFAULT 'geral',
        conteudo TEXT NOT NULL,
        projeto VARCHAR(200) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_agente (agente),
        INDEX idx_categoria (categoria),
        INDEX idx_created (created_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await p.execute(`
      CREATE TABLE IF NOT EXISTS agent_learnings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        categoria VARCHAR(100) NOT NULL,
        conteudo TEXT NOT NULL,
        fonte VARCHAR(200) DEFAULT 'sistema',
        hash_conteudo VARCHAR(64) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cat (categoria),
        INDEX idx_hash (hash_conteudo),
        INDEX idx_created (created_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await p.execute(`
      CREATE TABLE IF NOT EXISTS agent_audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agente VARCHAR(100) NOT NULL,
        acao VARCHAR(100) NOT NULL,
        detalhes TEXT DEFAULT NULL,
        resultado VARCHAR(50) DEFAULT 'ok',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_agente_acao (agente, acao),
        INDEX idx_created (created_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("[MYSQL] Tabelas verificadas/criadas com sucesso.");
    return true;
  } catch (err) {
    console.error("[MYSQL] Erro ao criar tabelas:", err.message);
    return false;
  }
}

const MysqlService = {
  ativo() {
    return !!getPool();
  },

  async testarConexao() {
    const p = getPool();
    if (!p) return { ok: false, error: "Pool nao configurado" };
    try {
      const [rows] = await p.execute("SELECT 1 as ping");
      return { ok: true, ping: rows[0].ping };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async inicializar() {
    const teste = await this.testarConexao();
    if (!teste.ok) {
      console.error("[MYSQL] Falha na conexao:", teste.error);
      return false;
    }
    console.log("[MYSQL] Conexao OK!");
    return await initTables();
  },

  async inserir(tabela, dados) {
    const p = getPool();
    if (!p) return null;
    try {
      const keys = Object.keys(dados);
      const values = Object.values(dados);
      const placeholders = keys.map(() => "?").join(", ");
      const sql = `INSERT INTO ${tabela} (${keys.join(", ")}) VALUES (${placeholders})`;
      const [result] = await p.execute(sql, values);
      return { id: result.insertId, ...dados };
    } catch (err) {
      console.error(`[MYSQL] Erro INSERT ${tabela}:`, err.message);
      return null;
    }
  },

  async buscar(tabela, { filtros = {}, limit = 50, orderBy = "created_at", ascending = false } = {}) {
    const p = getPool();
    if (!p) return [];
    try {
      const conditions = [];
      const values = [];
      for (const [key, val] of Object.entries(filtros)) {
        conditions.push(`${key} = ?`);
        values.push(val);
      }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const order = ascending ? "ASC" : "DESC";
      const sql = `SELECT * FROM ${tabela} ${where} ORDER BY ${orderBy} ${order} LIMIT ?`;
      values.push(limit);
      const [rows] = await p.execute(sql, values);
      return rows;
    } catch (err) {
      console.error(`[MYSQL] Erro SELECT ${tabela}:`, err.message);
      return [];
    }
  },

  async buscarPorTexto(tabela, texto, { limit = 20 } = {}) {
    const p = getPool();
    if (!p) return [];
    try {
      const sql = `SELECT * FROM ${tabela} WHERE conteudo LIKE ? ORDER BY created_at DESC LIMIT ?`;
      const [rows] = await p.execute(sql, [`%${texto}%`, limit]);
      return rows;
    } catch (err) {
      console.error(`[MYSQL] Erro SEARCH ${tabela}:`, err.message);
      return [];
    }
  },

  async contar(tabela, filtros = {}) {
    const p = getPool();
    if (!p) return 0;
    try {
      const conditions = [];
      const values = [];
      for (const [key, val] of Object.entries(filtros)) {
        conditions.push(`${key} = ?`);
        values.push(val);
      }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const sql = `SELECT COUNT(*) as total FROM ${tabela} ${where}`;
      const [rows] = await p.execute(sql, values);
      return rows[0].total;
    } catch (err) {
      return 0;
    }
  },

  async query(sql, params = []) {
    const p = getPool();
    if (!p) return [];
    try {
      const [rows] = await p.execute(sql, params);
      return rows;
    } catch (err) {
      console.error("[MYSQL] Erro query:", err.message);
      return [];
    }
  },

  async fechar() {
    if (pool) {
      await pool.end();
      pool = null;
      console.log("[MYSQL] Pool encerrado.");
    }
  },
};

module.exports = MysqlService;
