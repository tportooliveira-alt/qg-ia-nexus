/**
 * AgentMemory.js — Memória persistente por agente
 *
 * Cada agente aprende com projetos anteriores:
 * - O que funcionou (padrões aprovados)
 * - O que falhou (erros comuns)
 * - Preferências do usuário
 * - Contexto de projetos anteriores
 *
 * Custo: ZERO — usa Supabase (já pago) ou SQLite (local)
 */

let BD = null; // Injetado pelo server.js

function inicializar(bancoDeDados) {
    BD = bancoDeDados;
}

// ─── Salvar memória ───────────────────────────────────────────────────────────

async function salvar(agenteId, usuarioId, { tipo, conteudo, projetoId, metadata = {} }) {
    if (!BD) return null;

    try {
        const memoria = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
            agente_id: agenteId,
            usuario_id: usuarioId,
            projeto_id: projetoId || null,
            tipo_memoria: tipo || 'execucao',
            conteudo: typeof conteudo === 'object' ? JSON.stringify(conteudo) : conteudo,
            metadata: JSON.stringify(metadata),
            relevancia: 1.0,
            vezes_usada: 0,
            criado_em: new Date().toISOString()
        };

        await BD.inserir('agent_memories', memoria);
        return memoria.id;
    } catch (e) {
        console.warn(`[AgentMemory] Erro ao salvar memória do ${agenteId}:`, e.message);
        return null;
    }
}

// ─── Buscar memórias ──────────────────────────────────────────────────────────

async function buscarRecentes(usuarioId, limite = 10, agenteId = null) {
    if (!BD) return [];

    try {
        const filtros = { usuario_id: usuarioId };
        if (agenteId) filtros.agente_id = agenteId;
        return await BD.buscarTodos('agent_memories', filtros, limite, 'criado_em');
    } catch (e) {
        console.warn('[AgentMemory] Erro ao buscar:', e.message);
        return [];
    }
}

async function buscarPadroes(agenteId, usuarioId) {
    if (!BD) return [];
    try {
        return await BD.buscarTodos('agent_memories', {
            agente_id: agenteId,
            usuario_id: usuarioId,
            tipo_memoria: 'padrao_aprovado'
        }, 5, 'criado_em');
    } catch (e) { return []; }
}

async function buscarErrosComuns(agenteId, usuarioId) {
    if (!BD) return [];
    try {
        return await BD.buscarTodos('agent_memories', {
            agente_id: agenteId,
            usuario_id: usuarioId,
            tipo_memoria: 'erro_comum'
        }, 5, 'criado_em');
    } catch (e) { return []; }
}

// ─── Construir contexto histórico para injetar no prompt ─────────────────────

async function construirContexto(agenteId, usuarioId) {
    const [padroes, erros] = await Promise.all([
        buscarPadroes(agenteId, usuarioId),
        buscarErrosComuns(agenteId, usuarioId)
    ]);

    if (padroes.length === 0 && erros.length === 0) return '';

    let contexto = '\n\n--- MEMÓRIA DE SESSÕES ANTERIORES ---\n';

    if (padroes.length > 0) {
        contexto += 'O que funcionou bem antes:\n';
        padroes.forEach(m => { contexto += `- ${m.conteudo}\n`; });
    }

    if (erros.length > 0) {
        contexto += 'Erros a evitar:\n';
        erros.forEach(m => { contexto += `- ${m.conteudo}\n`; });
    }

    contexto += '--- FIM DA MEMÓRIA ---\n';
    return contexto;
}

// ─── Aprender com resultado da auditoria ─────────────────────────────────────

async function aprenderComAuditoria(usuarioId, plano, auditoria) {
    if (!BD || !auditoria) return;

    const promessas = [];

    // Salvar padrões que funcionaram
    if (auditoria.pontos_positivos?.length > 0) {
        auditoria.pontos_positivos.forEach(ponto => {
            promessas.push(salvar('sistema', usuarioId, {
                tipo: 'padrao_aprovado',
                conteudo: `[${plano.tipo_projeto}] ${ponto}`,
                metadata: { score: auditoria.score, tipo_projeto: plano.tipo_projeto }
            }));
        });
    }

    // Salvar erros comuns para evitar
    if (auditoria.problemas?.length > 0) {
        const problemasGraves = auditoria.problemas.filter(p =>
            p.gravidade === 'critica' || p.gravidade === 'alta'
        );
        problemasGraves.forEach(prob => {
            promessas.push(salvar(prob.local?.toLowerCase() || 'sistema', usuarioId, {
                tipo: 'erro_comum',
                conteudo: `Evitar: ${prob.descricao}. Fix: ${prob.como_corrigir || 'N/A'}`,
                metadata: { gravidade: prob.gravidade, local: prob.local }
            }));
        });
    }

    await Promise.allSettled(promessas);
}

module.exports = {
    inicializar,
    salvar,
    buscarRecentes,
    buscarPadroes,
    buscarErrosComuns,
    construirContexto,
    aprenderComAuditoria
};
