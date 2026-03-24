/**
 * ActivityService — rastreamento em tempo real da atividade dos agentes
 * Armazena em memória (sem banco) — auto-expira em 90 segundos
 * Usado pelo grafo n8n para mostrar quem está trabalhando agora
 */

const EXPIRA_MS = 90_000; // 90 segundos

/** @type {Map<string, {agenteId:string, status:string, projeto:string|null, descricao:string, iaUsada:string|null, desde:number, expira:number}>} */
const atividades = new Map();

const ActivityService = {
  /**
   * Registra/atualiza a atividade de um agente
   * @param {string} agenteId  - ID do nó no grafo (ex: 'nexus', 'analista', 'evolution')
   * @param {object} dados
   * @param {string} [dados.status='trabalhando']
   * @param {string|null} [dados.projeto]
   * @param {string} [dados.descricao]
   * @param {string|null} [dados.iaUsada]
   */
  registrar(agenteId, { status = 'trabalhando', projeto = null, descricao = '', iaUsada = null } = {}) {
    atividades.set(agenteId, {
      agenteId,
      status,
      projeto,
      descricao,
      iaUsada,
      desde: Date.now(),
      expira: Date.now() + EXPIRA_MS,
    });
  },

  /** Marca agente como finalizado (remove da lista de ativos) */
  finalizar(agenteId) {
    atividades.delete(agenteId);
  },

  /**
   * Lista atividades ativas (remove expiradas automaticamente)
   * @returns {Array}
   */
  listar() {
    const agora = Date.now();
    for (const [id, a] of atividades.entries()) {
      if (a.expira < agora) atividades.delete(id);
    }
    return [...atividades.values()];
  },

  /**
   * Retorna um snapshot amigável para o frontend
   * Inclui lista de IDs ativos para colorir nós no grafo
   */
  snapshot() {
    const lista = this.listar();
    return {
      ativos: lista.map(a => a.agenteId),
      detalhes: lista,
      total: lista.length,
      atualizado_em: new Date().toISOString(),
    };
  },
};

module.exports = ActivityService;
