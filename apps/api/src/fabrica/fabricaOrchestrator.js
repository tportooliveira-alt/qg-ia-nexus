/**
 * fabricaOrchestrator.js — Orquestrador Principal da Fábrica de IA v2.0
 *
 * Loop de autocorreção real: não para até entregar algo funcional.
 *
 * PIPELINE:
 * 1. ANALISTA    — extrai spec de conversa (opcional)
 * 2. COMANDANTE  — planeja o projeto
 * 3. ARQUITETO   — projeta estrutura técnica
 * 4. LOOP DE ENTREGA (até MAX_ITERACOES ou APROVADO):
 *    ├── CODIFICADOR — gera SQL + App + UI (ou planilha/documento)
 *    ├── DESIGNER    — cria design system + preview
 *    ├── AUDITOR     — revisa tudo (score 0-100)
 *    └── CORRETOR    — corrige cada problema apontado pelo Auditor
 * 5. SALVAR — persiste no banco de dados
 *
 * Entrega garantida: mesmo se não chegar a APROVADO,
 * entrega a melhor versão produzida com relatório de pendências.
 */

const commander = require('./agents/commander');
const architect = require('./agents/architect');
const coder     = require('./agents/coder');
const designer  = require('./agents/designer');
const auditor   = require('./agents/auditor');
const analyst   = require('./agents/analyst');
const fixer     = require('./agents/fixer');
const { listarProvedoresAtivos } = require('./agents/aiService');
const MysqlService = require('../services/mysqlService');

// ─── Configuração do Loop ─────────────────────────────────────────────────────
const MAX_ITERACOES   = 5;   // Máximo de tentativas antes de entregar assim mesmo
const SCORE_APROVACAO = 80;  // Score mínimo para considerar APROVADO (v3: era 75, muito permissivo)

// ─── Utilitário de log ────────────────────────────────────────────────────────
function addLog(logs, agente, msg, inicioTotal) {
    const entrada = {
        agente,
        msg,
        tempo_ms: Date.now() - inicioTotal,
        timestamp: new Date().toISOString()
    };
    logs.push(entrada);
    console.log(`[Fábrica][${agente}] ${msg} (${entrada.tempo_ms}ms total)`);
    return entrada;
}

// ─── Pipeline Principal ───────────────────────────────────────────────────────

async function executarPipeline(ideia, db, usuario_id = 'anonimo') {
    const inicioTotal = Date.now();
    const logs = [];

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏭 FÁBRICA DE IA — Iniciando pipeline`);
    console.log(`📝 Ideia: "${ideia.substring(0, 100)}..."`);
    console.log(`🤖 Provedores: ${listarProvedoresAtivos().join(', ')}`);
    console.log(`${'='.repeat(60)}\n`);

    // ── ETAPA 1: COMANDANTE ───────────────────────────────────────────────────
    addLog(logs, 'Comandante', '🎖️ Analisando ideia e montando plano estratégico...', inicioTotal);
    const plano = await commander.analisar(ideia);
    addLog(logs, 'Comandante', `✅ Plano: "${plano.nome_sugerido}" | tipo: ${plano.tipo_projeto} | complexidade: ${plano.complexidade}`, inicioTotal);

    // ── ETAPA 2: ARQUITETO ────────────────────────────────────────────────────
    addLog(logs, 'Arquiteto', '📐 Projetando estrutura técnica...', inicioTotal);
    let arquitetura = await architect.projetar(plano);
    addLog(logs, 'Arquiteto', `✅ Arquitetura: ${(arquitetura.tabelas || []).length} tabelas, ${(arquitetura.endpoints || []).length} endpoints`, inicioTotal);

    // ── DETECTAR TIPO DE ENTREGÁVEL ───────────────────────────────────────────
    const tipoEntregavel = plano.stack?.entregavel || arquitetura.tipo_entregavel || 'webapp';
    addLog(logs, 'Sistema', `📦 Tipo de entregável: ${tipoEntregavel}`, inicioTotal);

    // ── LOOP DE ENTREGA ───────────────────────────────────────────────────────
    let sql = null, codigoApp = null, codigoUI = null, planilha = null, documento = null;
    let designSystem = null;
    let melhorAuditoria = null;
    let melhorArtefatos = null;
    let iteracao = 0;
    let entregue = false;

    while (!entregue && iteracao < MAX_ITERACOES) {
        iteracao++;
        addLog(logs, 'Sistema', `🔄 Iteração ${iteracao}/${MAX_ITERACOES}`, inicioTotal);

        // ── CODIFICADOR ───────────────────────────────────────────────────────
        addLog(logs, 'Codificador', `💻 Gerando código (${tipoEntregavel})...`, inicioTotal);

        if (tipoEntregavel === 'planilha') {
            planilha = await coder.gerarPlanilha(arquitetura);
            addLog(logs, 'Codificador', `✅ Planilha: ${(planilha.abas || []).length} abas`, inicioTotal);
        } else if (tipoEntregavel === 'documento') {
            documento = await coder.gerarDocumento(arquitetura);
            addLog(logs, 'Codificador', `✅ Documento: ${(documento.secoes || []).length} seções`, inicioTotal);
        } else {
            sql       = await coder.gerarSQL(arquitetura);
            codigoApp = await coder.gerarApp(arquitetura);
            codigoUI  = await coder.gerarUI(arquitetura);
            addLog(logs, 'Codificador', `✅ SQL + App Node.js + UI HTML gerados`, inicioTotal);
        }

        // ── DESIGNER ──────────────────────────────────────────────────────────
        addLog(logs, 'Designer', '🎨 Criando design system...', inicioTotal);
        designSystem = await designer.projetarUI(arquitetura);
        addLog(logs, 'Designer', `✅ Design: ${(designSystem.componentes || []).length} componentes | layout: ${designSystem.layout}`, inicioTotal);

        // ── AUDITOR ───────────────────────────────────────────────────────────
        addLog(logs, 'Auditor', '🔍 Auditando todos os artefatos...', inicioTotal);
        const auditoria = await auditor.auditar({
            plano, arquitetura,
            sql: sql, app: codigoApp, ui: codigoUI,
            planilha, documento
        });
        addLog(logs, 'Auditor', `${auditoria.veredicto === 'APROVADO' ? '✅' : auditoria.veredicto === 'PARCIAL' ? '⚠️' : '❌'} Auditoria: ${auditoria.veredicto} | score: ${auditoria.score}/100 | problemas: ${(auditoria.problemas || []).length}`, inicioTotal);

        // Guardar melhor resultado até agora
        if (!melhorAuditoria || auditoria.score > melhorAuditoria.score) {
            melhorAuditoria = auditoria;
            melhorArtefatos = { arquitetura, sql, codigoApp, codigoUI, planilha, documento, designSystem };
        }

        // Verificar se aprovado
        if (auditoria.veredicto === 'APROVADO' || auditoria.score >= SCORE_APROVACAO) {
            addLog(logs, 'Sistema', `🎉 APROVADO na iteração ${iteracao}! Score: ${auditoria.score}/100`, inicioTotal);
            entregue = true;
            break;
        }

        // Se ainda tem iterações, corrigir
        if (iteracao < MAX_ITERACOES) {
            const problemasGraves = (auditoria.problemas || []).filter(
                p => p.gravidade === 'critica' || p.gravidade === 'alta'
            );
            addLog(logs, 'Corretor', `🔧 Corrigindo ${problemasGraves.length} problema(s) grave(s)...`, inicioTotal);

            if (tipoEntregavel === 'planilha') {
                planilha = await coder.gerarPlanilha(arquitetura);
            } else if (tipoEntregavel === 'documento') {
                documento = await coder.gerarDocumento(arquitetura);
            } else {
                const corrigidos = await fixer.corrigirTudo(
                    { arquitetura, sql, app: codigoApp, ui: codigoUI },
                    auditoria
                );
                arquitetura = corrigidos.arquitetura;
                sql         = corrigidos.sql;
                codigoApp   = corrigidos.app;
                codigoUI    = corrigidos.ui;
            }

            addLog(logs, 'Corretor', `✅ Correções aplicadas. Voltando ao Auditor...`, inicioTotal);
        }
    }

    // Usar melhor resultado obtido
    const artefatosFinal = melhorArtefatos;
    const auditorialFinal = melhorAuditoria;

    if (!entregue) {
        addLog(logs, 'Sistema', `⚠️ Atingiu ${MAX_ITERACOES} iterações. Entregando melhor versão (score: ${auditorialFinal?.score}/100)`, inicioTotal);
    }

    // ── MONTAR RESULTADO FINAL ────────────────────────────────────────────────
    const resultado = {
        id: Date.now().toString(),
        usuario_id,
        nome: plano.nome_sugerido,
        tipo: plano.tipo_projeto,
        tipo_entregavel: tipoEntregavel,
        ideia_original: ideia,
        status: auditorialFinal?.veredicto || 'PARCIAL',
        score_final: auditorialFinal?.score || 0,
        iteracoes_realizadas: iteracao,
        entregue_aprovado: entregue,

        // Plano e arquitetura
        plano,
        arquitetura: artefatosFinal?.arquitetura || arquitetura,

        // Artefatos de código
        codigo_sql:  artefatosFinal?.sql       || null,
        codigo_app:  artefatosFinal?.codigoApp || null,
        codigo_ui:   artefatosFinal?.codigoUI  || null,

        // Artefatos de docs/planilhas
        planilha:    artefatosFinal?.planilha   || null,
        documento:   artefatosFinal?.documento  || null,

        // Design
        design_system: artefatosFinal?.designSystem || null,

        // Auditoria
        auditoria: auditorialFinal,

        // Meta
        logs,
        provedores_usados: listarProvedoresAtivos(),
        tempo_total_ms: Date.now() - inicioTotal,
        criado_em: new Date().toISOString()
    };

    // ── SALVAR NO BANCO ───────────────────────────────────────────────────────
    if (db) {
        try {
            await salvarNoBanco(db, resultado);
            addLog(logs, 'Sistema', '💾 Salvo no banco de dados', inicioTotal);
        } catch (errDB) {
            addLog(logs, 'Sistema', `⚠️ Erro ao salvar: ${errDB.message}`, inicioTotal);
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏁 FÁBRICA — Pipeline concluído!`);
    console.log(`   Status:     ${resultado.status} (score: ${resultado.score_final}/100)`);
    console.log(`   Iterações:  ${iteracao}/${MAX_ITERACOES}`);
    console.log(`   Tempo:      ${(resultado.tempo_total_ms / 1000).toFixed(1)}s`);
    console.log(`   Entregável: ${tipoEntregavel}`);
    console.log(`${'='.repeat(60)}\n`);

    return resultado;
}

// ─── Salvar no banco ──────────────────────────────────────────────────────────

function salvarNoBanco(db, r) {
    if (db === 'mysql' && MysqlService.ativo()) {
        return MysqlService.inserir('projetos_fabrica', {
            id: r.id || Date.now().toString(),
            usuario_id:       r.usuario_id,
            nome:             r.nome,
            ideia_original:   r.ideia_original,
            arquitetura:      r.arquitetura,
            codigo_sql:       r.codigo_sql,
            codigo_app:       r.codigo_app,
            codigo_ui:        r.codigo_ui,
            status:           r.status,
            criado_em:        r.criado_em || new Date().toISOString()
        });
    } else if (db && typeof db.from === 'function') {
        // Supabase (Legado)
        return db.from('projetos_fabrica').insert({
            usuario_id:       r.usuario_id,
            nome:             r.nome,
            ideia_original:   r.ideia_original,
            json_arquitetura: r.arquitetura,
            codigo_sql:       r.codigo_sql,
            codigo_app:       r.codigo_app,
            codigo_ui:        r.codigo_ui,
            status:           r.status,
            atualizado_em:    r.criado_em
        });
    } else if (db && typeof db.run === 'function') {
        // SQLite
        return new Promise((resolve, reject) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS projetos_fabrica (
                    id TEXT PRIMARY KEY,
                    usuario_id TEXT,
                    nome TEXT NOT NULL,
                    tipo TEXT,
                    tipo_entregavel TEXT,
                    ideia_original TEXT,
                    json_plano TEXT,
                    json_arquitetura TEXT,
                    codigo_sql TEXT,
                    codigo_app TEXT,
                    codigo_ui TEXT,
                    json_planilha TEXT,
                    json_documento TEXT,
                    json_design TEXT,
                    json_auditoria TEXT,
                    status TEXT,
                    score_final INTEGER,
                    iteracoes INTEGER,
                    tempo_ms INTEGER,
                    criado_em TEXT
                )
            `, [], (err) => {
                if (err) return reject(err);
                db.run(`
                    INSERT INTO projetos_fabrica
                    (id, usuario_id, nome, tipo, tipo_entregavel, ideia_original,
                     json_plano, json_arquitetura, codigo_sql, codigo_app, codigo_ui,
                     json_planilha, json_documento, json_design, json_auditoria,
                     status, score_final, iteracoes, tempo_ms, criado_em)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                `, [
                    r.id, r.usuario_id, r.nome, r.tipo, r.tipo_entregavel,
                    r.ideia_original,
                    JSON.stringify(r.plano),
                    JSON.stringify(r.arquitetura),
                    r.codigo_sql, r.codigo_app, r.codigo_ui,
                    r.planilha   ? JSON.stringify(r.planilha)    : null,
                    r.documento  ? JSON.stringify(r.documento)   : null,
                    r.design_system ? JSON.stringify(r.design_system) : null,
                    JSON.stringify(r.auditoria),
                    r.status, r.score_final, r.iteracoes_realizadas,
                    r.tempo_total_ms, r.criado_em
                ], (errIns) => {
                    if (errIns) reject(errIns); else resolve(r.id);
                });
            });
        });
    }
}

// ─── Pipeline via Conversa do Cocriador ───────────────────────────────────────

async function executarPipelineDeConversa(conversa, db, usuario_id = 'anonimo') {
    console.log('[Fábrica] 🧪 Analisando conversa do Cocriador...');
    const spec  = await analyst.analisarConversa(conversa);
    const ideia = spec.prompt_perfeito || spec.ideia_condensada;
    console.log(`[Fábrica] 📋 Spec: "${ideia.substring(0, 100)}..."`);
    const resultado = await executarPipeline(ideia, db, usuario_id);
    resultado.spec_analista = spec;
    return resultado;
}

module.exports = { executarPipeline, executarPipelineDeConversa };
