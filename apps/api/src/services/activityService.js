/**
 * ActivityService — rastreamento em tempo real da atividade dos agentes
 * Status 'trabalhando': expira em 90s (tarefa pontual)
 * Status 'monitorando': expira em 24h (heartbeat contínuo)
 * Usado pelo grafo n8n para mostrar quem está ativo agora
 */

const EXPIRA_TRABALHO  = 90_000;         // 90 segundos para tarefas
const EXPIRA_MONITOR   = 24 * 3600_000;  // 24 horas para heartbeat

/** @type {Map<string, object>} */
const atividades = new Map();

/** Configs de heartbeat salvas — auto-restaura após finalizar() */
const heartbeats = new Map();

const ActivityService = {
  /**
   * Registra atividade pontual (tarefa em andamento)
   * Expira em 90s automaticamente
   */
  registrar(agenteId, { status = 'trabalhando', projeto = null, descricao = '', iaUsada = null } = {}) {
    atividades.set(agenteId, {
      agenteId, status, projeto, descricao, iaUsada,
      desde: Date.now(),
      expira: Date.now() + EXPIRA_TRABALHO,
      monitorando: false,
    });
  },

  /**
   * Registra estado contínuo de monitoramento (não expira em 90s)
   * Salva config para auto-restaurar quando finalizar() for chamado
   */
  monitorar(agenteId, { descricao = 'Monitorando', projeto = null } = {}) {
    // Salva config para auto-restore após finalizar()
    heartbeats.set(agenteId, { descricao, projeto });
    // Só substitui se não há tarefa ativa (não sobrescreve 'trabalhando')
    const atual = atividades.get(agenteId);
    if (atual && !atual.monitorando) return; // deixa tarefa ativa continuar
    atividades.set(agenteId, {
      agenteId,
      status: 'monitorando',
      projeto,
      descricao,
      iaUsada: null,
      desde: Date.now(),
      expira: Date.now() + EXPIRA_MONITOR,
      monitorando: true,
    });
  },

  /**
   * Finaliza tarefa e auto-restaura ao último estado de monitoramento
   * @param {string} agenteId
   * @param {object} [monitorConfig] - config explícita (opcional, usa heartbeat salvo se omitida)
   */
  finalizar(agenteId, monitorConfig = null) {
    atividades.delete(agenteId);
    const config = monitorConfig || heartbeats.get(agenteId);
    if (config) {
      setTimeout(() => this.monitorar(agenteId, config), 500);
    }
  },

  listar() {
    const agora = Date.now();
    for (const [id, a] of atividades.entries()) {
      if (a.expira < agora) atividades.delete(id);
    }
    return [...atividades.values()];
  },

  snapshot() {
    const lista = this.listar();
    return {
      ativos:      lista.map(a => a.agenteId),
      trabalhando: lista.filter(a => a.status === 'trabalhando').map(a => a.agenteId),
      monitorando: lista.filter(a => a.status === 'monitorando').map(a => a.agenteId),
      detalhes:    lista,
      total:       lista.length,
      atualizado_em: new Date().toISOString(),
    };
  },
};

module.exports = ActivityService;
