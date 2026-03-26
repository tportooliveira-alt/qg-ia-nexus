/**
 * ContextRouter.js — Roteador de Contexto Inteligente
 *
 * PROBLEMA RESOLVIDO:
 * Sem isso, cada agente recebe todo o SkillHub + todas as fontes = 50k tokens = caro e confuso.
 * Com isso, cada agente recebe APENAS o contexto do seu domínio = contexto cirúrgico.
 *
 * FLUXO:
 * 1. Detecta domínio da ideia (software, agro, mecânica, etc.)
 * 2. Extrai do SkillHub apenas as fontes relevantes para esse domínio
 * 3. Cada sub-agente recebe seu pacote mínimo de contexto
 *
 * MODELO IA POR COMPLEXIDADE:
 *   simples  → gemini-2.0-flash (grátis, ultra-rápido)
 *   media    → gemini-2.0-flash com mais tokens (ainda grátis)
 *   complexa → gemini-2.5-flash (grátis, mais capaz)
 *   critica  → Claude (pago, só para revisão final obrigatória)
 */

const path = require('path');
const fs   = require('fs');

// Carrega o SkillHub uma vez (cache em memória)
let _skillHubCache = null;
function getSkillHub() {
    if (_skillHubCache) return _skillHubCache;
    try {
        const skillPath = path.join(__dirname, '../../..', 'apps/api/src/skills/SkillHub.json');
        _skillHubCache = JSON.parse(fs.readFileSync(skillPath, 'utf-8'));
    } catch {
        _skillHubCache = { fontes_conhecimento_tecnico: {}, agentes_especialistas: [] };
    }
    return _skillHubCache;
}

// ─── Mapa de palavras-chave por domínio ────────────────────────────────────────
const DOMINIOS = {
    software: {
        palavras: ['app', 'sistema', 'api', 'site', 'dashboard', 'web', 'mobile', 'backend',
                   'frontend', 'banco', 'database', 'código', 'software', 'plataforma',
                   'saas', 'crud', 'login', 'cadastro', 'relatório', 'automação'],
        fontes_hub: ['software_e_dev', 'devops_infra'],
        agentes:    ['Backend Specialist', 'Frontend Specialist', 'Database Architect',
                     'DevOps Engineer', 'Security Auditor', 'QA Automation Engineer'],
        ia_debate:  'gemini-2.0-flash',
        ia_codigo:  'deepseek'
    },
    agro: {
        palavras: ['fazenda', 'rebanho', 'gado', 'boi', 'pasto', 'lavoura', 'colheita',
                   'agro', 'pecuária', 'bovino', 'suíno', 'aves', 'soja', 'milho',
                   'frigorífico', 'abate', 'carne', 'rastreabilidade', 'agronomia',
                   'rural', 'safra', 'irrigação', 'solo', 'brucella', 'aftosa'],
        fontes_hub: ['agronegocio_brasil', 'software_e_dev'],
        agentes:    ['Agro Specialist', 'Backend Specialist', 'Database Architect',
                     'Mobile Developer'],
        ia_debate:  'gemini-2.0-flash',
        ia_codigo:  'deepseek'
    },
    mecanica: {
        palavras: ['mecânica', 'motor', 'engrenagem', 'estrutura', 'resistência', 'torque',
                   'manutenção', 'equipamento', 'máquina', 'industrial', 'manufatura',
                   'cad', 'solidworks', 'simulação', 'vibração', 'fadiga', 'metalurgia'],
        fontes_hub: ['engenharia_mecanica', 'software_e_dev'],
        agentes:    ['Mechanical Engineer', 'Backend Specialist', 'Database Architect'],
        ia_debate:  'gemini-2.0-flash',
        ia_codigo:  'gemini'
    },
    eletrica: {
        palavras: ['elétrica', 'eletrônica', 'circuito', 'iot', 'sensor', 'arduino',
                   'raspberry', 'automação', 'clp', 'plc', 'scada', 'inversor',
                   'motor elétrico', 'tensão', 'corrente', 'potência', 'ieee'],
        fontes_hub: ['engenharia_eletrica', 'software_e_dev'],
        agentes:    ['Electrical Engineer', 'Backend Specialist', 'DevOps Engineer'],
        ia_debate:  'gemini-2.0-flash',
        ia_codigo:  'deepseek'
    },
    civil: {
        palavras: ['civil', 'construção', 'obra', 'estrutural', 'concreto', 'fundação',
                   'topografia', 'hidráulica', 'saneamento', 'pavimentação', 'projeto',
                   'planta baixa', 'memorial descritivo', 'orçamento obra'],
        fontes_hub: ['engenharia_civil', 'software_e_dev'],
        agentes:    ['Civil Architect', 'Backend Specialist', 'Database Architect'],
        ia_debate:  'gemini-2.0-flash',
        ia_codigo:  'gemini'
    },
    quimica: {
        palavras: ['química', 'processo', 'reação', 'bioquímica', 'petroquímica',
                   'fermentação', 'destilação', 'bioprocesso', 'laboratório',
                   'reagente', 'ph', 'viscosidade', 'temperatura processo'],
        fontes_hub: ['engenharia_quimica', 'software_e_dev'],
        agentes:    ['Chemical Engineer', 'Backend Specialist'],
        ia_debate:  'gemini-2.0-flash',
        ia_codigo:  'gemini'
    },
    ia_ml: {
        palavras: ['machine learning', 'inteligência artificial', 'modelo', 'treinar',
                   'dataset', 'neural', 'embedding', 'vector', 'rag', 'llm',
                   'fine-tuning', 'classificação', 'predição', 'nlp', 'visão computacional'],
        fontes_hub: ['ia_e_ml', 'software_e_dev'],
        agentes:    ['AI Research Scout', 'Backend Specialist', 'Database Architect'],
        ia_debate:  'gemini-2.5-flash',
        ia_codigo:  'deepseek'
    }
};

// ─── Modelo Gemini por nível de complexidade ───────────────────────────────────
const GEMINI_POR_COMPLEXIDADE = {
    simples:  { modelo: 'gemini-2.0-flash',   maxTokens: 1024,  descricao: 'Grátis, ultra-rápido' },
    media:    { modelo: 'gemini-2.0-flash',   maxTokens: 2048,  descricao: 'Grátis, mais tokens'  },
    complexa: { modelo: 'gemini-2.5-flash',   maxTokens: 4096,  descricao: 'Grátis, mais capaz'   },
    critica:  { modelo: 'claude-revisor-final', maxTokens: 4096, descricao: 'Pago — só revisão final' }
};

// ─── Detectar domínio da ideia ─────────────────────────────────────────────────
function detectarDominio(ideia) {
    const texto = (ideia || '').toLowerCase();
    const scores = {};

    for (const [dominio, config] of Object.entries(DOMINIOS)) {
        scores[dominio] = config.palavras.filter(p => texto.includes(p)).length;
    }

    // Domínio com mais palavras encontradas
    const melhor = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

    // Se nenhum domínio detectado, assume software (mais comum)
    if (!melhor || melhor[1] === 0) {
        return { dominio: 'software', confianca: 'baixa', scores };
    }

    return {
        dominio:    melhor[0],
        confianca:  melhor[1] >= 3 ? 'alta' : melhor[1] >= 1 ? 'media' : 'baixa',
        pontuacao:  melhor[1],
        scores
    };
}

// ─── Montar contexto mínimo para um agente específico ─────────────────────────
function montarContextoAgente(dominio, tipoAgente, complexidade = 'media') {
    const hub     = getSkillHub();
    const config  = DOMINIOS[dominio] || DOMINIOS.software;
    const modelo  = GEMINI_POR_COMPLEXIDADE[complexidade] || GEMINI_POR_COMPLEXIDADE.media;

    // Extrai só as fontes do domínio detectado
    const fontesDominio = {};
    for (const chave of config.fontes_hub) {
        if (hub.fontes_conhecimento_tecnico?.[chave]) {
            fontesDominio[chave] = hub.fontes_conhecimento_tecnico[chave];
        }
    }

    // Extrai só o agente especialista relevante
    const agentesRelevantes = (hub.agentes_especialistas || [])
        .filter(a => config.agentes.includes(a.nome));

    // MCPs recomendados para o domínio
    const mcpsRecomendados = hub.mcps_oficiais?.[0]?.sub_servidores?.slice(0, 3) || [];

    return {
        dominio,
        tipo_agente:          tipoAgente,
        modelo_recomendado:   modelo,
        ia_debate:            config.ia_debate,
        ia_codigo:            config.ia_codigo,
        fontes_autorizadas:   fontesDominio,
        agentes_disponiveis:  agentesRelevantes,
        mcps_disponiveis:     mcpsRecomendados,
        regras_confianca:     hub.regras_de_confianca?.criterios || [],
        instrucao: `Você é especialista no domínio: ${dominio}. ` +
                   `Use APENAS as fontes listadas em fontes_autorizadas para embasar suas respostas. ` +
                   `Não invente bibliotecas ou soluções que não estejam nos repos oficiais autorizados.`
    };
}

// ─── Distribuir contextos para todos os sub-agentes do pipeline ───────────────
function distribuirContextos(ideia, complexidade = 'media') {
    const { dominio, confianca, scores } = detectarDominio(ideia);

    return {
        dominio,
        confianca,
        scores,
        complexidade,
        modelo_gemini: GEMINI_POR_COMPLEXIDADE[complexidade] || GEMINI_POR_COMPLEXIDADE.media,
        contextos: {
            analista:    montarContextoAgente(dominio, 'Analista',   'simples'),
            comandante:  montarContextoAgente(dominio, 'Comandante', 'media'),
            arquiteto:   montarContextoAgente(dominio, 'Arquiteto',  complexidade),
            designer:    montarContextoAgente(dominio, 'Designer',   'simples'),
            codificador: montarContextoAgente(dominio, 'Codificador', complexidade),
            auditor:     montarContextoAgente(dominio, 'Auditor',    'critica') // Claude sempre
        }
    };
}

module.exports = {
    detectarDominio,
    montarContextoAgente,
    distribuirContextos,
    GEMINI_POR_COMPLEXIDADE,
    DOMINIOS
};
