const MySQLService = require("./mysqlService");

const FinancialService = {
  async registrarTransacao(projeto, tipo, valor, descricao) {
    const sql = `
      INSERT INTO transacoes_financeiras (projeto, tipo, valor, descricao)
      VALUES (?, ?, ?, ?);
    `;
    try {
      await MySQLService.query(sql, [projeto, tipo, valor, descricao]);
      console.log(`[CFO] Transação registrada: ${tipo} de R$${valor} em ${projeto}`);
    } catch (err) {
      console.error("[CFO] Erro ao registrar transação:", err.message);
    }
  },

  async gerarResumoDRE(projeto) {
    const sql = `
      SELECT 
        SUM(CASE WHEN tipo = 'RECEITA' THEN valor ELSE 0 END) as total_receita,
        SUM(CASE WHEN tipo = 'DESPESA' THEN valor ELSE 0 END) as total_despesa
      FROM transacoes_financeiras
      WHERE projeto = ?;
    `;
    const [res] = await MySQLService.query(sql, [projeto]);
    const lucro = res.total_receita - res.total_despesa;
    return { ...res, lucro };
  },

  async inicializarTabelaFinanceira() {
    const sql = `
      CREATE TABLE IF NOT EXISTS transacoes_financeiras (
        id INT AUTO_INCREMENT PRIMARY KEY,
        projeto VARCHAR(100),
        tipo ENUM('RECEITA', 'DESPESA'),
        valor DECIMAL(10, 2),
        descricao TEXT,
        data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await MySQLService.query(sql);
  }
};

module.exports = FinancialService;