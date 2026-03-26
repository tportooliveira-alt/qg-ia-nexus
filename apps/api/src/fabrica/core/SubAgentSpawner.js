/**
 * SubAgentSpawner.js — Motor de spawn dinâmico de sub-agentes
 *
 * Executa múltiplos agentes em paralelo via Promise.allSettled.
 * Se um falhar, os outros continuam — nunca trava o pipeline todo.
 * Pode contratar agentes extras dinamicamente se a tarefa for complexa.
 */

const TIMEOUT_PADRAO = 50000; // 50s por sub-agente

/**
 * Executa um único sub-agente com timeout e callbacks de progresso
 */
async function executar({ nome, fn, timeout = TIMEOUT_PADRAO, onIniciado, onConcluido, onErro }) {
    onIniciado?.();
    const inicio = Date.now();

    try {
        const resultado = await Promise.race([
            fn(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout: ${nome} excedeu ${timeout}ms`)), timeout)
            )
        ]);
        const tempoMs = Date.now() - inicio;
        onConcluido?.(resultado, tempoMs);
        return resultado;
    } catch (err) {
        const tempoMs = Date.now() - inicio;
        onErro?.(err, tempoMs);
        throw err;
    }
}

/**
 * Executa múltiplos agentes em paralelo
 * Retorna array com {nome, status, resultado|erro} para cada um
 */
async function executarParalelo(tarefas, emit) {
    const inicio = Date.now();
    const nomes = tarefas.map(t => t.nome);

    emit?.({ tipo: 'sub_agentes_spawn', agentes: nomes, mensagem: `Spawnando ${nomes.length} sub-agentes em paralelo` });

    const promessas = tarefas.map(tarefa =>
        executar({
            ...tarefa,
            onIniciado: () => emit?.({ tipo: 'agente_ativo', agente: tarefa.nome }),
            onConcluido: (r, ms) => emit?.({ tipo: 'agente_concluido', agente: tarefa.nome, tempo_ms: ms }),
            onErro: (e, ms) => emit?.({ tipo: 'agente_erro', agente: tarefa.nome, erro: e.message, tempo_ms: ms })
        }).then(r => ({ nome: tarefa.nome, status: 'ok', resultado: r }))
          .catch(e => ({ nome: tarefa.nome, status: 'erro', erro: e.message, resultado: null }))
    );

    const resultados = await Promise.all(promessas);
    const ok  = resultados.filter(r => r.status === 'ok').length;
    const err = resultados.filter(r => r.status === 'erro').length;

    emit?.({
        tipo: 'sub_agentes_concluido',
        agentes: nomes,
        ok, erros: err,
        tempo_ms: Date.now() - inicio,
        mensagem: `${ok}/${nomes.length} sub-agentes concluídos em ${Date.now() - inicio}ms`
    });

    return resultados;
}

/**
 * Decide dinamicamente se precisa de agentes extras baseado na complexidade
 */
function calcularAgentesNecessarios(arquitetura, tipoEntregavel) {
    const complexidade = arquitetura.tabelas?.length > 5 ? 'complexa' : 'simples';

    const planos = {
        webapp: ['SqlAgent', 'BackendAgent', 'FrontendAgent'],
        api:    ['SqlAgent', 'BackendAgent'],
        site:   ['FrontendAgent'],
        dashboard: ['SqlAgent', 'BackendAgent', 'FrontendAgent'],
        planilha:  ['PlanilhaAgent'],
        documento: ['DocumentoAgent'],
        apresentacao: ['ApresentacaoAgent'],
        automacao: ['ScriptAgent'],
    };

    const agentes = planos[tipoEntregavel] || planos.webapp;

    // Se muito complexo, adiciona agente de segurança extra
    if (complexidade === 'complexa' && !agentes.includes('SecurityAgent')) {
        console.log('[Spawner] Projeto complexo — contratando SecurityAgent adicional');
        agentes.push('SecurityAgent');
    }

    return agentes;
}

module.exports = { executar, executarParalelo, calcularAgentesNecessarios };
