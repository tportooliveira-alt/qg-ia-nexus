/**
 * CoderChief.js — Supervisor de Sub-Agentes de Código
 *
 * Não gera código diretamente — SPAWNA sub-agentes especializados em paralelo.
 * Reduz o tempo de geração de ~26s sequencial para ~10s paralelo (62% mais rápido).
 *
 * Pode "contratar" agentes extras dinamicamente se o projeto for muito complexo.
 */

const SubAgentSpawner = require('../core/SubAgentSpawner');
const AgentMemory     = require('../core/AgentMemory');

const SqlAgent        = require('./sub/SqlAgent');
const BackendAgent    = require('./sub/BackendAgent');
const FrontendAgent   = require('./sub/FrontendAgent');
const PlanilhaAgent   = require('./sub/PlanilhaAgent');
const DocumentoAgent  = require('./sub/DocumentoAgent');

// Mapa de agentes disponíveis
const AGENTES = {
    SqlAgent,
    BackendAgent,
    FrontendAgent,
    PlanilhaAgent,
    DocumentoAgent
};

// Plano de quais sub-agentes usar por tipo de entregável
const PLANO_AGENTES = {
    webapp:       ['SqlAgent', 'BackendAgent', 'FrontendAgent'],
    api:          ['SqlAgent', 'BackendAgent'],
    site:         ['FrontendAgent'],
    dashboard:    ['SqlAgent', 'BackendAgent', 'FrontendAgent'],
    fullstack:    ['SqlAgent', 'BackendAgent', 'FrontendAgent'],
    planilha:     ['PlanilhaAgent'],
    documento:    ['DocumentoAgent'],
    apresentacao: ['DocumentoAgent'],
    automacao:    ['BackendAgent'],
    script:       ['BackendAgent'],
};

async function executar(arquitetura, tipoEntregavel, usuario_id, emit) {
    // Determinar sub-agentes necessários
    const subAgentesNecessarios = PLANO_AGENTES[tipoEntregavel] || PLANO_AGENTES.webapp;

    emit?.({
        tipo: 'coder_chief_inicio',
        agente: 'CoderChief',
        mensagem: `Spawnando ${subAgentesNecessarios.length} sub-agentes: ${subAgentesNecessarios.join(', ')}`,
        sub_agentes: subAgentesNecessarios
    });

    // Carregar memórias relevantes para enriquecer o contexto
    const [memorias_sql, memorias_backend, memorias_frontend] = await Promise.all([
        AgentMemory.buscarErrosComuns('sql_agent', usuario_id),
        AgentMemory.buscarErrosComuns('backend_agent', usuario_id),
        AgentMemory.buscarErrosComuns('frontend_agent', usuario_id)
    ]);

    const contextoEnriquecido = {
        arquitetura,
        usuario_id,
        memorias_sql,
        memorias_backend,
        memorias_frontend
    };

    // Montar tarefas para execução paralela
    const tarefas = subAgentesNecessarios.map(nome => ({
        nome,
        fn: () => AGENTES[nome].gerar(contextoEnriquecido),
        timeout: 50000
    }));

    // Executar TODOS em paralelo
    const resultados = await SubAgentSpawner.executarParalelo(tarefas, emit);

    // Consolidar resultados
    const artefatos = {
        sql:       null,
        codigo_app: null,
        codigo_ui: null,
        planilha:  null,
        documento: null
    };

    resultados.forEach(r => {
        if (r.status === 'ok') {
            switch (r.nome) {
                case 'SqlAgent':      artefatos.sql        = r.resultado; break;
                case 'BackendAgent':  artefatos.codigo_app = r.resultado; break;
                case 'FrontendAgent': artefatos.codigo_ui  = r.resultado; break;
                case 'PlanilhaAgent': artefatos.planilha   = r.resultado; break;
                case 'DocumentoAgent': artefatos.documento = r.resultado; break;
            }
        } else {
            console.warn(`[CoderChief] Sub-agente ${r.nome} falhou: ${r.erro}`);
            // Salvar na memória para evitar repetir o erro
            AgentMemory.salvar(r.nome.toLowerCase(), usuario_id, {
                tipo: 'erro_comum',
                conteudo: `Falhou com erro: ${r.erro}`,
                metadata: { tipo_projeto: tipoEntregavel }
            }).catch(() => {});
        }
    });

    const ok = resultados.filter(r => r.status === 'ok').length;
    emit?.({
        tipo: 'coder_chief_concluido',
        agente: 'CoderChief',
        mensagem: `${ok}/${subAgentesNecessarios.length} sub-agentes concluídos`,
        artefatos_gerados: Object.keys(artefatos).filter(k => artefatos[k] !== null)
    });

    return artefatos;
}

module.exports = { executar };
