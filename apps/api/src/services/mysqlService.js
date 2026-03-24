const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const MySQLService = {
  pool: null,

  /**
   * Retorna o pool de conexões. Cria na primeira chamada (lazy init).
   * O pool mantém conexões abertas e reutiliza — sem abrir/fechar a cada query.
   */
  getPool() {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        // Reconectar automaticamente se a conexão cair
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });

      console.log('[MYSQL] Pool de conexões criado (limite: 10).');
    }
    return this.pool;
  },

  /**
   * Executa uma query usando o pool (sem abrir/fechar conexão).
   * O pool empresta uma conexão, executa, e devolve automaticamente.
   */
  async query(sql, params) {
    try {
      const pool = this.getPool();
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (err) {
      console.error('[MYSQL ERROR]', err.message);
      throw err;
    }
  },

  async inicializarTabelas() {
    console.log('[MYSQL] Verificando tabelas base...');

    await this.query(`
      CREATE TABLE IF NOT EXISTS ideias_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        agente VARCHAR(50),
        status VARCHAR(20) DEFAULT 'capturada',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS agent_memories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agente VARCHAR(100),
        categoria VARCHAR(100) DEFAULT 'geral',
        conteudo TEXT,
        projeto VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_agente (agente),
        INDEX idx_projeto (projeto)
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        agente VARCHAR(100) NOT NULL DEFAULT 'sistema',
        acao TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'ok',
        detalhe TEXT,
        origem VARCHAR(100) DEFAULT 'api',
        alvo VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_agente (agente)
      );
    `);

    console.log('[MYSQL] Estrutura pronta.');
  },

  /**
   * Fecha o pool de conexões (usar no shutdown do servidor).
   */
  async fecharPool() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('[MYSQL] Pool de conexões encerrado.');
    }
  }
};

module.exports = MySQLService;
