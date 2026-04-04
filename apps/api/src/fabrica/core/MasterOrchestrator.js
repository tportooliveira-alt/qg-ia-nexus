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
const juiz       = require('../agents/juiz'); // Novo Agente Judicial
const CoderChief = require('../agents/CoderChief');
const agentSmith = require('../agents/agentSmith');
const AgentMemory = require('./AgentMemory');
const PipelineManager = require('./PipelineManager');
const ContextRouter = require('./ContextRouter');
const { listarProvedoresAtivos } = require('../agents/aiService');
const MysqlService = require('../../services/mysqlService');
const ToolExecutor = require('../../services/toolExecutor');

const MAX_ITERACOES   = 3;   // evita timeout longo quando provedores estao instaveis
const SCORE_APROVACAO = 75;  // limiar pratico para liberar entrega

// ─── Estratégia de custo por iteração ─────────────────────────────────────────
function nivelPorIteracao(iteracao) {
    if (iteracao <= 2) return 'economico';
    if (iteracao <= 4) return 'normal';
    return 'premium';
}

function normalizarPlanoSeguro(plano, ideiaBase) {
    const p = plano && typeof plano === 'object' ? plano : {};
    const stack = p.stack && typeof p.stack === 'object' ? p.stack : {};
    return {
        tipo_projeto: p.tipo_projeto || 'app',
        nome_sugerido: p.nome_sugerido || 'ProjetoFabrica',
        complexidade: p.complexidade || 'media',
        descricao_executiva: p.descricao_executiva || (ideiaBase || '').slice(0, 180) || 'Plano padrao',
        stack: {
            entregavel: stack.entregavel || 'webapp',
            frontend: stack.frontend || 'HTML/CSS/JS',
            backend: stack.backend || 'Node.js/Express',
            banco: stack.banco || 'PostgreSQL',
            extras: Array.isArray(stack.extras) ? stack.extras : []
        },
        etapas: Array.isArray(p.etapas) ? p.etapas : [],
        funcionalidades_principais: Array.isArray(p.funcionalidades_principais) ? p.funcionalidades_principais : []
    };
}

// ─── Especialistas por Domínio ───────────────────────────────────────────────
const ESPECIALISTAS = {
    agronegocio: require('../skills/agentes/PecuariaExpert.json'),
    pecuaria: require('../skills/agentes/PecuariaExpert.json'),
    financas: require('../skills/agentes/AnalistaFinanceiro.json'),
    erp: require('../skills/agentes/AnalistaFinanceiro.json')
};

// ─── Executar pipeline completo ───────────────────────────────────────────────

async function executar(ideia, pipelineId, usuario_id, emit) {
    const inicio = Date.now();
    const deadlineMs = 4 * 60 * 1000;

    emit({ tipo: 'pipeline_iniciado', progresso: 0, fase: 0,
           mensagem: `Fábrica de IA iniciada | Provedores: ${listarProvedoresAtivos().join(', ')}` });

    try {
        // ── PRÉ: Detectar domínio + distribuir contextos mínimos ──────────
        const roteamento = ContextRouter.distribuirContextos(ideia, 'media');
        emit({ tipo: 'dominio_detectado', progresso: 2,
               mensagem: `Domínio: ${roteamento.dominio} (confiança: ${roteamento.confianca}) | Modelo: ${roteamento.modelo_gemini.modelo}`,
               dados: { dominio: roteamento.dominio, confianca: roteamento.confianca } });

        // ── FASE 0: TEAM BUILDING (Agent Smith) ──────────
        emit({ tipo: 'thought', agente: 'smith', mensagem: '⚙️ Agente Smith analisando complexidade e convocando equipe de elite...' });
        const equipe = await agentSmith.montarTime(ideia, roteamento.dominio);
        if (equipe.especialistas?.length > 0) {
            emit({ tipo: 'thought', agente: 'smith', mensagem: `👥 Equipe convocada: ${equipe.especialistas.join(', ')}` });
        }

        // ── PRÉ: Inteligência Estratégica (Memória + Web Search) ──────────
        emit({ tipo: 'thought', agente: 'contexto', mensagem: '🧠 Consultando arquivos de memória e realizando pesquisa de mercado em tempo real...' });
        
        const [memorias, pesquisaWeb] = await Promise.all([
            AgentMemory.buscarRecentes(usuario_id, 3),
            ToolExecutor.executeTool('web_search', { query: `especificações técnicas modernas 2026 para ${ideia.slice(0, 60)}` }).catch(() => null)
        ]);

        let contextoEnriquecido = "";
        
        // Injeta Especialista de Nicho se houver match de domínio
        const especialista = ESPECIALISTAS[roteamento.dominio.toLowerCase()];
        if (especialista) {
            emit({ tipo: 'thought', agente: 'contexto', mensagem: `🐎 Especialista em ${especialista.nome} convocado para auditoria de requisitos.` });
            contextoEnriquecido += `\n\nREGRAS DE OURO DO ESPECIALISTA (${especialista.nome}):\n${especialista.regras_de_ouro.join('\n')}`;
            contextoEnriquecido += `\nCAPACIDADES ADICIONAIS: ${especialista.capacidades.join(', ')}`;
        }

        if (memorias?.length > 0) {
            contextoEnriquecido += `\n\nMEMÓRIAS DE PROJETOS PASSADOS:\n${memorias.map(m => m.conteudo).join('\n')}`;
            emit({ tipo: 'thought', agente: 'contexto', mensagem: `📚 ${memorias.length} fragmentos de memória recrutados.` });
        }

        if (pesquisaWeb?.success && pesquisaWeb.results?.length > 0) {
            const trechoPesquisa = pesquisaWeb.results.map(r => `- ${r.title}: ${r.snippet}`).join('\n');
            contextoEnriquecido += `\n\nTENDÊNCIAS DE MERCADO (WEB):\n${trechoPesquisa}`;
            emit({ tipo: 'thought', agente: 'contexto', mensagem: '🌐 Visão web ativa: Pesquisa integrada ao planejamento estratégico.' });
        }

        // ── FASE 1: ANALISTA ──────────────────
        if (PipelineManager.estaCancelado(pipelineId)) return emitCancelado(emit);
        emit({ tipo: 'thought', agente: 'analista', mensagem: '🔍 Processando requisitos com inteligência de mercado e de nicho...' });
        emit({ tipo: 'agente_ativo', agente: 'Analista', fase: 1, progresso: 5,
               mensagem: '🧪 Analisando ideia e validando viabilidade tecnológica...' });

        const analistaContexto = `${roteamento.contextos.analista}\n\n${contextoEnriquecido}`;
        const spec = await analyst.analisarConversa([{ role: 'user', content: ideia }], analistaContexto);
        const ideiaOtimizada = spec.prompt_perfeito || ideia;

        emit({ tipo: 'thought', agente: 'analista', mensagem: `✨ Requisitos extraídos. Sugestão: ${spec.nome_sugerido || 'App Nexus'}.` });
        emit({ tipo: 'agente_concluido', agente: 'Analista', fase: 1, progresso: 12,
               mensagem: `Tipo detectado: ${spec.tipo_projeto || 'app'}`,
               dados: { tipo: spec.tipo_projeto, complexidade: spec.funcionalidades?.length || 0 } });

        // ── FASE 1: COMANDANTE ──────────────────
        if (PipelineManager.estaCancelado(pipelineId)) return emitCancelado(emit);
        emit({ tipo: 'thought', agente: 'comandante', mensagem: '🎖️ Estruturando marcos do projeto e definindo stack técnica ideal...' });
        emit({ tipo: 'agente_ativo', agente: 'Comandante', fase: 1, progresso: 12,
               mensagem: '🎖️ Montando plano estratégico...' });

        let plano = await commander.analisar(ideiaOtimizada, roteamento.contextos.comandante);
        plano = normalizarPlanoSeguro(plano, ideiaOtimizada);

        emit({ tipo: 'thought', agente: 'comandante', mensagem: `🎯 Alvo travado: ${plano.complexidade} complexidade detectada.` });
        emit({ tipo: 'agente_concluido', agente: 'Comandante', fase: 1, progresso: 22,
               mensagem: `Plano: "${plano.nome_sugerido}" | ${plano.tipo_projeto} | ${plano.complexidade}`,
               dados: { nome: plano.nome_sugerido, tipo: plano.tipo_projeto } });

        const tipoEntregavel = plano.stack?.entregavel || 'webapp';

        // ── FASE 2: PARALELO ─────────────
        if (PipelineManager.estaCancelado(pipelineId)) return emitCancelado(emit);
        emit({ tipo: 'thought', agente: 'contexto', mensagem: '⚡ Orquestrando trabalho paralelo: Gerando esquemas de banco e identidade visual...' });
        emit({ tipo: 'fase_iniciada', fase: 2, progresso: 22,
               mensagem: '⚡ Arquiteto e Designer trabalhando em paralelo...' });

        // Ajusta complexidade real baseada no plano do comandante
        const complexidadeReal = plano.complexidade || 'media';
        const roteamentoFinal  = ContextRouter.distribuirContextos(ideia, complexidadeReal);

        const [arquitetura, designConceito] = await Promise.all([
            architect.projetar(plano, roteamentoFinal.contextos.arquiteto).then(r => {
                emit({ tipo: 'thought', agente: 'arquiteto', mensagem: `🗺️ Mapa do sistema desenhado: ${r.tabelas?.length || 0} tabelas normalizadas.` });
                emit({ tipo: 'agente_concluido', agente: 'Arquiteto', progresso: 35,
                       mensagem: `${r.tabelas?.length || 0} tabelas, ${r.endpoints?.length || 0} endpoints` });
                return r;
            }),
            designer.projetarUI(plano, roteamentoFinal.contextos.designer).then(r => { 
                emit({ tipo: 'thought', agente: 'designer', mensagem: '🎨 Identidade visual e tokens de design definidos.' });
                emit({ tipo: 'agente_concluido', agente: 'Designer-Conceito', progresso: 32,
                       mensagem: 'Conceito visual definido' });
                return r;
            }).catch(() => null) 
        ]);

        // ── FASE 3: LOOP DE ENTREGA ────────────────────────────────────────
        let melhor = { score: 0, artefatos: null, auditoria: null, design: null };
        let iteracao = 0;
        let aprovado = false;
        let semMelhora = 0;
        const historicoIteracoes = []; 

        while (!aprovado && iteracao < MAX_ITERACOES) {
            if (PipelineManager.estaCancelado(pipelineId)) return emitCancelado(emit);
            if ((Date.now() - inicio) > deadlineMs) {
                emit({ tipo: 'thought', agente: 'contexto', mensagem: '⏰ Tempo limite atingido. Finalizando com o melhor estado atual.' });
                break;
            }
            iteracao++;
            emit({ tipo: 'thought', agente: 'contexto', mensagem: `🔄 Iniciando ciclo de produção #${iteracao}...` });
            const progBase = 40 + (iteracao - 1) * 12;

            // Nível de custo cresce com as iterações
            const nivel = nivelPorIteracao(iteracao);
            const nivelLabel = nivel === 'economico' ? '💚 grátis' : nivel === 'premium' ? '💜 premium' : '🔵 normal';

            emit({ tipo: 'thought', agente: 'coder', mensagem: `💻 Spawning engenheiros de software especializados [${nivelLabel}]...` });
            emit({ tipo: 'fase_iniciada', fase: 3, iteracao, progresso: progBase,
                   mensagem: `🔄 Iteração ${iteracao}/${MAX_ITERACOES} [${nivelLabel}] — Gerando artefatos...` });

            // CoderChief spawna sub-agentes em paralelo
            const artefatos = await CoderChief.executar(
                arquitetura, tipoEntregavel, usuario_id, emit, nivel, pipelineId
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
                semMelhora = 0;
            } else {
                semMelhora += 1;
            }

            // Aprovado?
            if (auditoria.score >= SCORE_APROVACAO || auditoria.veredicto === 'APROVADO') {
                aprovado = true;
                emit({ tipo: 'pipeline_aprovado', progresso: 88,
                       mensagem: `✅ Aprovado na iteração ${iteracao} com score ${auditoria.score}/100` });
                break;
            }

            if (semMelhora >= 2) {
                emit({
                    tipo: 'pipeline_parcial',
                    progresso: 87,
                    mensagem: 'Sem melhora de score em iteracoes seguidas; encerrando para evitar custo/timeout.'
                });
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
                    iteracoes: resultado.iteracoes,
                    aprovado: resultado.aprovado,
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

        // ── FASE FINAL: DIAGNÓSTICO DE ELITE ───────────────────────────
        emit({ tipo: 'thought', agente: 'contexto', mensagem: '🩺 Iniciando diagnóstico final de infraestrutura e saúde do código...' });
        try {
            const diagnostico = await auditor.analisar(melhor.artefatos, { ...roteamentoFinal.contextos.auditor, modo: 'diagnostico_final' });
            emit({ tipo: 'thought', agente: 'auditor', mensagem: `✅ Diagnóstico concluído: ${diagnostico.status === 'aprovado' ? 'Sistema Saudável' : 'Ajustes menores recomendados'}.` });
        } catch (e) {
            console.warn("Falha no diagnostico final:", e.message);
        }

        // ── CONCLUIR ──────────────────────────────────────────────────
        PipelineManager.concluir(pipelineId, melhor);
        emit({ tipo: 'pipeline_concluido', progresso: 100, 
               mensagem: `✨ "${melhor.artefatos?.nome || 'Projeto'}" entregue com score ${melhor.score}/100`,
               dados: { ...melhor.artefatos, score: melhor.score, iteracoes: iteracao } });

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

