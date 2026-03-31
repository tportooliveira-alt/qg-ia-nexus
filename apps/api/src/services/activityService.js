/**
 * ActivityService — rastreamento em tempo real da atividade dos agentes
 * Status 'trabalhando': expira em 90s (tarefa pontual)
 * Status 'monitorando': expira em 24h (heartbeat contínuo)
 * Usado pelo grafo n8n para mostrar quem está ativo agora
 */

const EXPIRA_TRABALHO  = 90_000;         // 90 segundos para tarefas
const EXPIRA_MONITOR   = 24 * 3600_000;  // 24 horas para heartbeat
const MAX_HISTORICO    = 2000;

/** @type {Map<string, object>} */
const atividades = new Map();
const historico = [];

/** Configs de heartbeat salvas — auto-restaura após finalizar() */
const heartbeats = new Map();

const ActivityService = {
  _registrarHistorico(evento) {
    historico.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      ...evento,
    });
    if (historico.length > MAX_HISTORICO) {
      historico.splice(0, historico.length - MAX_HISTORICO);
    }
  },

  /**
   * Registra atividade pontual (tarefa em andamento)
   * Expira em 90s automaticamente
   */
  registrar(agenteId, { status = 'trabalhando', projeto = null, descricao = '', iaUsada = null, detalhes = null, aprendizado = null, artefatos = null } = {}) {
    const payload = {
      agenteId, status, projeto, descricao, iaUsada,
      detalhes,
      aprendizado,
      artefatos,
      desde: Date.now(),
      expira: Date.now() + EXPIRA_TRABALHO,
      monitorando: false,
      atualizadoEm: Date.now(),
    };
    atividades.set(agenteId, payload);
    this._registrarHistorico({
      tipo: "atividade",
      agenteId,
      status,
      projeto,
      descricao,
      iaUsada,
      detalhes,
      aprendizado,
      artefatos,
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
    const payload = {
      agenteId,
      status: 'monitorando',
      projeto,
      descricao,
      iaUsada: null,
      detalhes: null,
      aprendizado: null,
      artefatos: null,
      desde: Date.now(),
      expira: Date.now() + EXPIRA_MONITOR,
      monitorando: true,
      atualizadoEm: Date.now(),
    };
    atividades.set(agenteId, payload);
    this._registrarHistorico({
      tipo: "monitoramento",
      agenteId,
      status: "monitorando",
      projeto,
      descricao,
    });
  },

  /**
   * Finaliza tarefa e auto-restaura ao último estado de monitoramento
   * @param {string} agenteId
   * @param {object} [monitorConfig] - config explícita (opcional, usa heartbeat salvo se omitida)
   */
  finalizar(agenteId, monitorConfig = null) {
    const atual = atividades.get(agenteId);
    this._registrarHistorico({
      tipo: "finalizado",
      agenteId,
      status: atual?.status || "desconhecido",
      projeto: atual?.projeto || null,
      descricao: atual?.descricao || "Finalizado",
      detalhes: atual?.detalhes || null,
      aprendizado: atual?.aprendizado || null,
      artefatos: atual?.artefatos || null,
    });
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

  historico({ agenteId = null, limit = 200 } = {}) {
    const lim = Math.max(1, Math.min(parseInt(limit, 10) || 200, MAX_HISTORICO));
    const base = agenteId
      ? historico.filter((h) => h.agenteId === agenteId)
      : historico;
    return base.slice(-lim).reverse();
  },
};

module.exports = ActivityService;
