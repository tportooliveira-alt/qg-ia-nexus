/**
 * MasterOrchestrator.js — Cérebro Central da Fábrica de IA v4.0
 *
 * FILOSOFIA:
 * - Agentes trabalham em paralelo sempre que possível (mais rápido, mais barato)
 * - Claude (Anthropic) é o supervisor/auditor — código sempre passa por mim
 * - Sistema aprende com cada projeto (AgentMemory)
 * - Loop de autocorreção até score >= 75 ou max 4 iterações
 * - Custo mínimo: Gemini + Groq grátis para 80% do trabalho
 * - Agentes se corrigem sozinhos mas NUNCA sem supervisão do Auditor (Claude)
 *
 * FLUXO:
 * 1. Analista (Groq — rápido/grátis) extrai spec
 * 2. Comandante (Anthropic — raciocínio) planeja
 * 3. PARALELO: Arquiteto (Gemini) + Conceito Design (Gemini)
 * 4. LOOP: CoderChief spawna sub-agentes em paralelo → Auditor (Claude) revisa
 *    → Se reprovado: Corretor (DeepSeek) corrige → volta ao Auditor
 * 5. Aprende com o resultado — salva na memória
 */

const commander  = require('../agents/commander');
const architect  = require('../agents/architect');
const designer   = require('../agents/designer');
const analyst    = require('../agents/analyst');
const auditor    = require('../agents/auditor');
const fixer      = require('../agents/fixer');
const CoderChief = require('../agents/CoderChief');
const AgentMemory = require('./AgentMemory');
const PipelineManager = require('./PipelineManager');
const ContextRouter = require('./ContextRouter');
const { listarProvedoresAtivos } = require('../agents/aiService');
const MysqlService = require('../../services/mysqlService');

const MAX_ITERACOES   = 6;   // 6 chances de chegar ao score ideal
const SCORE_APROVACAO = 85;  // 85+ para aprovar

// ─── Estratégia de custo por iteração ─────────────────────────────────────────
// Iterações 1-2: só grátis (Groq, Gemini, Cerebras) — rápido e sem custo
// Iterações 3-4: normal (inclui DeepSeek, Mistral, Together) — barato
// Iterações 5-6: premium (Anthropic claude-sonnet-4-6) — só quando necessário
function nivelPorIteracao(iteracao) {
    if (iteracao <= 2) return 'economico';
    if (iteracao <= 4) return 'normal';
    return 'premium';
}

// ─── Executar pipeline completo ───────────────────────────────────────────────

async function executar(ideia, pipelineId, usuario_id, emit) {
    const inicio = Date.now();

    emit({ tipo: 'pipeline_iniciado', progresso: 0, fase: 0,
           mensagem: `Fábrica de IA iniciada | Provedores: ${listarProvedoresAtivos().join(', ')}` });

    try {
        // ── PRÉ: Detectar domínio + distribuir contextos mínimos ──────────
        const roteamento = ContextRouter.distribuirContextos(ideia, 'media');
        emit({ tipo: 'dominio_detectado', progresso: 2,
               mensagem: `Domínio: ${roteamento.dominio} (confiança: ${roteamento.confianca}) | Modelo: ${roteamento.modelo_gemini.modelo}`,
               dados: { dominio: roteamento.dominio, confianca: roteamento.confianca } });

        // ── PRÉ: Carregar contexto da memória ─────────────────────────────
        const [memorias] = await Promise.all([
            AgentMemory.buscarRecentes(usuario_id, 5)
        ]);
        if (memorias.length > 0) {
            emit({ tipo: 'memoria_carregada', mensagem: `${memorias.length} memórias carregadas`, progresso: 3 });
        }

        // ── FASE 1: ANALISTA (Groq — ultra-rápido, grátis) ───────────────
        if (PipelineManager.estaCancelado(pipelineId)) return emitCancelado(emit);
        emit({ tipo: 'agente_ativo', agente: 'Analista', fase: 1, progresso: 5,
               mensagem: '🧪 Analisando e extraindo requisitos...' });

        const spec = await analyst.analisarConversa([{ role: 'user', content: ideia }], roteamento.contextos.analista);
        const ideiaOtimizada = spec.prompt_perfeito || ideia;

        emit({ tipo: 'agente_concluido', agente: 'Analista', fase: 1, progresso: 12,
               mensagem: `Tipo detectado: ${spec.tipo_projeto || 'app'}`,
               dados: { tipo: spec.tipo_projeto, complexidade: spec.funcionalidades?.length || 0 } });

        // ── FASE 1: COMANDANTE (Anthropic — raciocínio estratégico) ──────
        if (PipelineManager.estaCancelado(pipelineId)) return emitCancelado(emit);
        emit({ tipo: 'agente_ativo', agente: 'Comandante', fase: 1, progresso: 12,
               mensagem: '🎖️ Montando plano estratégico...' });

        const plano = await commander.analisar(ideiaOtimizada, roteamento.contextos.comandante);

        emit({ tipo: 'agente_concluido', agente: 'Comandante', fase: 1, progresso: 22,
               mensagem: `Plano: "${plano.nome_sugerido}" | ${plano.tipo_projeto} | ${plano.complexidade}`,
               dados: { nome: plano.nome_sugerido, tipo: plano.tipo_projeto } });

        const tipoEntregavel = plano.stack?.entregavel || 'webapp';

        // ── FASE 2: PARALELO — Arquiteto + Conceito Designer ─────────────
        if (PipelineManager.estaCancelado(pipelineId)) return emitCancelado(emit);
        emit({ tipo: 'fase_iniciada', fase: 2, progresso: 22,
               mensagem: '⚡ Arquiteto e Designer trabalhando em paralelo...' });

        // Ajusta complexidade real baseada no plano do comandante
        const complexidadeReal = plano.complexidade || 'media';
        const roteamentoFinal  = ContextRouter.distribuirContextos(ideia, complexidadeReal);

        const [arquitetura, designConceito] = await Promise.all([
            architect.projetar(plano, roteamentoFinal.contextos.arquiteto).then(r => {
                emit({ tipo: 'agente_concluido', agente: 'Arquiteto', progresso: 35,
                       mensagem: `${r.tabelas?.length || 0} tabelas, ${r.endpoints?.length || 0} endpoints` });
                return r;
            }),
            designer.projetarUI(plano, roteamentoFinal.contextos.designer).then(r => { // FIX: fase 2 usa plano (arquitetura ainda não existe); arquitetura chega depois no loop
                emit({ tipo: 'agente_concluido', agente: 'Designer-Conceito', progresso: 32,
                       mensagem: 'Conceito visual definido' });
                return r;
            }).catch(() => null) // Designer falhar não quebra o pipeline
        ]);

        // ── FASE 3: LOOP DE ENTREGA ────────────────────────────────────────
        let melhor = { score: 0, artefatos: null, auditoria: null, design: null };
        let iteracao = 0;
        let aprovado = false;
        const historicoIteracoes = []; // Engenheiro de Contexto: histórico entre iterações

        while (!aprovado && iteracao < MAX_ITERACOES) {
            if (PipelineManager.estaCancelado(pipelineId)) return emitCancelado(emit);
            iteracao++;
            const progBase = 40 + (iteracao - 1) * 12;

            // Nível de custo cresce com as iterações: grátis → normal → premium
            const nivel = nivelPorIteracao(iteracao);
            const nivelLabel = nivel === 'economico' ? '💚 grátis' : nivel === 'premium' ? '💜 premium' : '🔵 normal';

            emit({ tipo: 'fase_iniciada', fase: 3, iteracao, progresso: progBase,
                   mensagem: `🔄 Iteração ${iteracao}/${MAX_ITERACOES} [${nivelLabel}] — Gerando artefatos...` });

            // CoderChief spawna sub-agentes em paralelo
            const artefatos = await CoderChief.executar(
                arquitetura, tipoEntregavel, usuario_id, emit, nivel
            );

            // Designer refina
            const designFinal = designConceito || artefatos.codigo_ui
                ? await designer.projetarUI(arquitetura).catch(() => designConceito)
                : null;
            emit({ tipo: 'agente_concluido', agente: 'Designer', progresso: progBase + 8,
                   mensagem: 'Design system finalizado' });

            // ─ AUDITOR: escala qualidade com as iterações ─────────────────
            if (PipelineManager.estaCancelado(pipelineId)) return emitCancelado(emit);
            const auditorLabel = nivel === 'premium' ? 'Auditor-Claude-Sonnet' : 'Auditor';
            emit({ tipo: 'agente_ativo', agente: auditorLabel, progresso: progBase + 9,
                   mensagem: `🔍 Revisando código [${nivelLabel}]...` });

            const auditoria = await auditor.auditar({
                plano, arquitetura,
                sql: artefatos.sql, app: artefatos.codigo_app, ui: artefatos.codigo_ui,
                planilha: artefatos.planilha, documento: artefatos.documento,
                testes: artefatos.testes, seguranca: artefatos.seguranca,
                nivel,  // passa o nível para o auditor usar o modelo certo
                historicoIteracoes  // Engenheiro de Contexto: auditor sabe o que já revisou
            });

            emit({ tipo: 'auditoria_resultado', agente: 'Auditor-Claude',
                   progresso: progBase + 11,
                   mensagem: `${auditoria.veredicto} — Score: ${auditoria.score}/100 — ${auditoria.problemas?.length || 0} problema(s)`,
                   dados: { score: auditoria.score, veredicto: auditoria.veredicto,
                            problemas: auditoria.problemas?.slice(0, 3) } });

            // Engenheiro de Contexto: salvar histórico desta iteração
            historicoIteracoes.push({
                iteracao,
                score: auditoria.score,
                veredicto: auditoria.veredicto,
                problemas: (auditoria.problemas || []).map(p => ({ gravidade: p.gravidade, local: p.local, descricao: p.descricao })),
                nivel
            });

            // Guardar melhor resultado
            if (auditoria.score > melhor.score) {
                melhor = { score: auditoria.score, artefatos, auditoria, design: designFinal };
            }

            // Aprovado?
            if (auditoria.score >= SCORE_APROVACAO || auditoria.veredicto === 'APROVADO') {
                aprovado = true;
                emit({ tipo: 'pipeline_aprovado', progresso: 88,
                       mensagem: `✅ Aprovado na iteração ${iteracao} com score ${auditoria.score}/100` });
                break;
            }

            // Corretor corrige para próxima iteração
            if (iteracao < MAX_ITERACOES) {
                const problemasGraves = (auditoria.problemas || []).filter(
                    p => p.gravidade === 'critica' || p.gravidade === 'alta'
                );
                emit({ tipo: 'agente_ativo', agente: 'Corretor', progresso: progBase + 11,
                       mensagem: `🔧 Corrigindo ${problemasGraves.length} problema(s) graves...` });

                try {
                    const corrigidos = await fixer.corrigirTudo(
                        { arquitetura, sql: artefatos.sql, app: artefatos.codigo_app, ui: artefatos.codigo_ui },
                        auditoria
                    );
                    // Aplicar corre��es para pr�xima itera��o
                    Object.assign(arquitetura, corrigidos.arquitetura || {});
                } catch (fixErr) {
                    emit({
                        tipo: 'agente_erro',
                        agente: 'Corretor',
                        progresso: progBase + 11,
                        mensagem: `Corretor falhou, seguindo sem corre��o nesta itera��o: ${fixErr.message}`
                    });
                    console.warn('[MasterOrchestrator] Corretor falhou:', fixErr.message);
                }
            }
        }

        if (!aprovado) {
            emit({ tipo: 'pipeline_parcial', progresso: 88,
                   mensagem: `⚠️ Entregando melhor versão após ${iteracao} iterações (score: ${melhor.score}/100)` });
        }

        // ── FASE 4: APRENDER + SALVAR ─────────────────────────────────────
        emit({ tipo: 'fase_iniciada', fase: 4, progresso: 90, mensagem: '💾 Salvando e aprendendo...' });

        const resultadosMemoria = await Promise.allSettled([
            AgentMemory.aprenderComAuditoria(usuario_id, plano, melhor.auditoria),
            AgentMemory.salvar('comandante', usuario_id, {
                tipo: 'padrao_aprovado',
                conteudo: `Plano ${plano.tipo_projeto} funcionou: ${plano.nome_sugerido}`,
                metadata: { score: melhor.score }
            }),
        ]);
        resultadosMemoria.forEach((r, i) => {
            if (r.status === 'rejected') console.error(`[MasterOrchestrator] Falha ao salvar memória [${i}]:`, r.reason?.message);
        });

        // ── RESULTADO FINAL ───────────────────────────────────────────────
        const resultado = {
            id: pipelineId,
            usuario_id,
            nome: plano.nome_sugerido,
            tipo: plano.tipo_projeto,
            tipo_entregavel: tipoEntregavel,
            ideia_original: ideia,
            status: aprovado ? 'APROVADO' : melhor.auditoria?.veredicto || 'PARCIAL',
            score_final: melhor.score,
            iteracoes: iteracao,
            aprovado,
            plano,
            arquitetura,
            codigo_sql:     melhor.artefatos?.sql           || null,
            codigo_app:     melhor.artefatos?.codigo_app    || null,
            codigo_ui:      melhor.artefatos?.codigo_ui     || null,
            planilha:       melhor.artefatos?.planilha      || null,
            documento:      melhor.artefatos?.documento     || null,
            testes:         melhor.artefatos?.testes        || null,
            seguranca:      melhor.artefatos?.seguranca     || null,
            documentacao:   melhor.artefatos?.documentacao  || null,
            deploy_config:  melhor.artefatos?.deploy_config || null,
            design_system:  melhor.design,
            auditoria: melhor.auditoria,
            tempo_total_ms: Date.now() - inicio,
            criado_em: new Date().toISOString()
        };

        // ── SALVAR NO MYSQL PORTADO DA FÁBRICA ────────────────────────────
        if (MysqlService.ativo()) {
            try {
                await MysqlService.inserir('projetos_fabrica', {
                    id: resultado.id,
                    usuario_id: resultado.usuario_id,
                    nome: resultado.nome,
                    tipo: resultado.tipo,
                    tipo_entregavel: resultado.tipo_entregavel,
                    ideia_original: resultado.ideia_original,
                    status: resultado.status,
                    score_final: resultado.score_final,
                    iteracoes: resultado.iteracoes_realizadas,
                    aprovado: resultado.entregue_aprovado,
                    plano: resultado.plano,
                    arquitetura: resultado.arquitetura,
                    codigo_sql: resultado.codigo_sql,
                    codigo_app: resultado.codigo_app,
                    codigo_ui: resultado.codigo_ui,
                    planilha: resultado.planilha,
                    documento: resultado.documento,
                    testes: resultado.testes,
                    seguranca: resultado.seguranca,
                    documentacao: resultado.documentacao,
                    deploy_config: resultado.deploy_config,
                    design_system: resultado.design_system,
                    auditoria: resultado.auditoria,
                    tempo_total_ms: resultado.tempo_total_ms,
                    criado_em: resultado.criado_em
                });
                console.log(`[MasterOrchestrator] Projeto "${resultado.nome}" salvo no MySQL (score: ${resultado.score_final})`);
            } catch (saveErr) {
                console.error('[MasterOrchestrator] Falha ao salvar no MySQL:', saveErr.message);
            }
        }

        emit({ tipo: 'pipeline_concluido', progresso: 100,
               mensagem: `🏁 Concluído em ${((Date.now() - inicio)/1000).toFixed(1)}s | Score: ${melhor.score}/100`,
               dados: resultado });

        return resultado;

    } catch (err) {
        emit({ tipo: 'pipeline_erro', progresso: -1,
               mensagem: `Erro fatal: ${err.message}` });
        throw err;
    }
}

function emitCancelado(emit) {
    emit({ tipo: 'pipeline_cancelado', progresso: -1, mensagem: 'Pipeline cancelado' });
}

module.exports = { executar };

