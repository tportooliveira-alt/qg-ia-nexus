/**
 * CoderChief.js — Supervisor de Sub-Agentes de Código v2.0
 *
 * Não gera código diretamente — SPAWNA sub-agentes especializados em paralelo.
 * Reduz o tempo de geração de ~26s sequencial para ~10s paralelo (62% mais rápido).
 *
 * SUB-AGENTES DISPONÍVEIS:
 * - SqlAgent:      Banco de dados + migrações (Groq → Gemini)
 * - BackendAgent:  API Node.js/Express (DeepSeek → Groq → Gemini)
 * - FrontendAgent: SPA HTML/CSS/JS premium (Gemini → Groq → Anthropic)
 * - PlanilhaAgent: Excel/Planilha (Groq → Gemini)
 * - DocumentoAgent: Word/PDF (Groq → Gemini)
 * - TestAgent:     Testes Jest/Supertest (Groq → Gemini)
 * - SecurityAgent: Análise OWASP (Anthropic → Groq → Gemini)
 * - DocAgent:      README + API docs Markdown (Groq → Gemini)
 * - DeployAgent:   Docker + Nginx + PM2 + CI/CD (Groq → Gemini)
 */

const SubAgentSpawner = require('../core/SubAgentSpawner');
const AgentMemory     = require('../core/AgentMemory');
const ArtifactService = require('../../services/artifactService');

const SqlAgent        = require('./sub/SqlAgent');
const BackendAgent    = require('./sub/BackendAgent');
const FrontendAgent   = require('./sub/FrontendAgent');
const PlanilhaAgent   = require('./sub/PlanilhaAgent');
const DocumentoAgent  = require('./sub/DocumentoAgent');
const TestAgent       = require('./sub/TestAgent');
const SecurityAgent   = require('./sub/SecurityAgent');
const DocAgent        = require('./sub/DocAgent');
const DeployAgent     = require('./sub/DeployAgent');

// Mapa de agentes disponíveis
const AGENTES = {
    SqlAgent,
    BackendAgent,
    FrontendAgent,
    PlanilhaAgent,
    DocumentoAgent,
    TestAgent,
    SecurityAgent,
    DocAgent,
    DeployAgent
};

// Plano de quais sub-agentes usar por tipo de entregável
// Ordem: core agents primeiro, depois extras em paralelo
const PLANO_AGENTES = {
    webapp:       ['SqlAgent', 'BackendAgent', 'FrontendAgent', 'TestAgent', 'DocAgent'],
    api:          ['SqlAgent', 'BackendAgent', 'TestAgent', 'SecurityAgent', 'DocAgent'],
    site:         ['FrontendAgent', 'DocAgent'],
    dashboard:    ['SqlAgent', 'BackendAgent', 'FrontendAgent', 'DocAgent'],
    fullstack:    ['SqlAgent', 'BackendAgent', 'FrontendAgent', 'TestAgent', 'SecurityAgent', 'DocAgent', 'DeployAgent'],
    planilha:     ['PlanilhaAgent'],
    documento:    ['DocumentoAgent'],
    apresentacao: ['DocumentoAgent'],
    automacao:    ['BackendAgent', 'TestAgent', 'DocAgent'],
    script:       ['BackendAgent', 'DocAgent'],
    deploy:       ['DeployAgent', 'DocAgent'],
};

async function executar(arquitetura, tipoEntregavel, usuario_id, emit, nivel, pipelineId) {
    // Determinar sub-agentes necessários
    const subAgentesNecessarios = PLANO_AGENTES[tipoEntregavel] || PLANO_AGENTES.webapp;

    emit?.({
        tipo: 'coder_chief_inicio',
        agente: 'CoderChief',
        mensagem: `Spawnando ${subAgentesNecessarios.length} sub-agentes: ${subAgentesNecessarios.join(', ')}`,
        sub_agentes: subAgentesNecessarios
    });

    const contextoEnriquecido = {
        arquitetura,
        usuario_id,
        pipelineId,
        nivel
    };

    // Montar tarefas para execução paralela
    const tarefas = subAgentesNecessarios.map(nome => ({
        nome,
        fn: () => AGENTES[nome].gerar(contextoEnriquecido),
        timeout: 60000  // 60s por sub-agente
    }));

    // Executar TODOS em paralelo
    const resultados = await SubAgentSpawner.executarParalelo(tarefas, emit);

    // Consolidar resultados
    const artefatos = {
        sql:            null,
        codigo_app:     null,
        codigo_ui:      null,
        planilha:       null,
        documento:      null,
        testes:         null,
        seguranca:      null,
        documentacao:   null,
        deploy_config:  null,
        arquivos:       []
    };

    resultados.forEach(r => {
        if (r.status === 'ok') {
            switch (r.nome) {
                case 'SqlAgent':      artefatos.sql           = r.resultado; break;
                case 'BackendAgent':  artefatos.codigo_app    = r.resultado; break;
                case 'FrontendAgent': artefatos.codigo_ui     = r.resultado; break;
                case 'PlanilhaAgent': artefatos.planilha      = r.resultado; break;
                case 'DocumentoAgent': artefatos.documento    = r.resultado; break;
                case 'TestAgent':     artefatos.testes        = r.resultado; break;
                case 'SecurityAgent': artefatos.seguranca     = r.resultado; break;
                case 'DocAgent':      artefatos.documentacao  = r.resultado; break;
                case 'DeployAgent':   artefatos.deploy_config = r.resultado; break;
            }
        }
    });

    // ── GERAÇÃO DE ARQUIVOS REAIS ───────────────────────────────────
    if (artefatos.planilha && pipelineId) {
        try {
            const excel = await ArtifactService.gerarExcel(pipelineId, artefatos.planilha);
            artefatos.arquivos.push(excel);
            emit?.({ tipo: 'thought', agente: 'coder', mensagem: `📂 Planilha Excel real gerada com sucesso: ${excel.filename}` });
        } catch (e) { console.error("Falha ao gerar Excel real:", e.message); }
    }

    if (artefatos.documento && pipelineId) {
        try {
            const word = await ArtifactService.gerarWord(pipelineId, artefatos.documento);
            artefatos.arquivos.push(word);
            emit?.({ tipo: 'thought', agente: 'coder', mensagem: `📂 Documento Word (.docx) real gerado com sucesso: ${word.filename}` });
        } catch (e) { console.error("Falha ao gerar Word real:", e.message); }
    }

    const ok = resultados.filter(r => r.status === 'ok').length;
    emit?.({
        tipo: 'coder_chief_concluido',
        agente: 'CoderChief',
        mensagem: `${ok}/${subAgentesNecessarios.length} sub-agentes concluídos`,
        artefatos_gerados: Object.keys(artefatos).filter(k => artefatos[k] !== null && k !== 'arquivos'),
        arquivos_para_download: artefatos.arquivos
    });

    return artefatos;
}

module.exports = { executar };
