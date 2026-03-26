/**
 * PipelineManager.js — Gerencia sessões SSE ativas
 *
 * Cada pipeline tem:
 * - ID único
 * - Emitter (função que envia eventos SSE para o cliente)
 * - Status em tempo real
 * - Controle de cancelamento
 *
 * Limite: 10 pipelines ativos simultâneos (segurança do free tier)
 */

const MAX_PIPELINES_ATIVOS = 10;
const TIMEOUT_PIPELINE_MS  = 360000; // 6 minutos max

// Mapa de pipelines ativos: pipelineId -> { emitter, status, inicio, cancelado }
const pipelines = new Map();

// ─── Criar pipeline ───────────────────────────────────────────────────────────

function criar(pipelineId, usuarioId) {
    if (pipelines.size >= MAX_PIPELINES_ATIVOS) {
        throw new Error(`Limite de ${MAX_PIPELINES_ATIVOS} pipelines ativos atingido. Aguarde ou cancele um.`);
    }

    pipelines.set(pipelineId, {
        id: pipelineId,
        usuario_id: usuarioId,
        status: 'aguardando',
        emitters: new Set(),  // múltiplos clientes podem assistir o mesmo pipeline
        inicio: Date.now(),
        cancelado: false,
        ultimo_evento: Date.now()
    });

    // Auto-cleanup após timeout
    setTimeout(() => {
        if (pipelines.has(pipelineId)) {
            const p = pipelines.get(pipelineId);
            if (p.status !== 'concluido' && p.status !== 'erro') {
                emitir(pipelineId, { tipo: 'pipeline_timeout', mensagem: 'Pipeline expirou após 6 minutos' });
                remover(pipelineId);
            }
        }
    }, TIMEOUT_PIPELINE_MS);

    console.log(`[PipelineManager] Pipeline criado: ${pipelineId} | Ativos: ${pipelines.size}`);
    return pipelineId;
}

// ─── Registrar emitter SSE ────────────────────────────────────────────────────

function registrarEmitter(pipelineId, emitFn) {
    const pipeline = pipelines.get(pipelineId);
    if (!pipeline) return false;
    pipeline.emitters.add(emitFn);
    return true;
}

function removerEmitter(pipelineId, emitFn) {
    const pipeline = pipelines.get(pipelineId);
    if (!pipeline) return;
    pipeline.emitters.delete(emitFn);
}

// ─── Emitir evento para todos os clientes ────────────────────────────────────

function emitir(pipelineId, evento) {
    const pipeline = pipelines.get(pipelineId);
    if (!pipeline) return;

    pipeline.ultimo_evento = Date.now();
    if (evento.status) pipeline.status = evento.status;
    if (evento.tipo === 'pipeline_concluido') pipeline.status = 'concluido';
    if (evento.tipo === 'pipeline_erro') pipeline.status = 'erro';

    const data = JSON.stringify({
        ...evento,
        pipeline_id: pipelineId,
        timestamp: new Date().toISOString()
    });

    pipeline.emitters.forEach(emitFn => {
        try {
            emitFn(data);
        } catch (e) {
            console.warn(`[PipelineManager] Erro ao emitir para cliente:`, e.message);
            pipeline.emitters.delete(emitFn);
        }
    });
}

// ─── Criar função emit para uso no orquestrador ───────────────────────────────

function criarEmitter(pipelineId) {
    return (evento) => emitir(pipelineId, evento);
}

// ─── Cancelar pipeline ────────────────────────────────────────────────────────

function cancelar(pipelineId) {
    const pipeline = pipelines.get(pipelineId);
    if (!pipeline) return false;

    pipeline.cancelado = true;
    emitir(pipelineId, {
        tipo: 'pipeline_cancelado',
        mensagem: 'Pipeline cancelado pelo usuário',
        progresso: -1
    });
    setTimeout(() => remover(pipelineId), 3000);
    return true;
}

function estaCancelado(pipelineId) {
    return pipelines.get(pipelineId)?.cancelado === true;
}

// ─── Remover pipeline ─────────────────────────────────────────────────────────

function remover(pipelineId) {
    pipelines.delete(pipelineId);
    console.log(`[PipelineManager] Pipeline removido: ${pipelineId} | Ativos: ${pipelines.size}`);
}

// ─── Status geral ─────────────────────────────────────────────────────────────

function status() {
    const lista = [];
    pipelines.forEach((p, id) => {
        lista.push({
            id,
            usuario_id: p.usuario_id,
            status: p.status,
            tempo_ms: Date.now() - p.inicio,
            clientes: p.emitters.size
        });
    });
    return { total: pipelines.size, max: MAX_PIPELINES_ATIVOS, pipelines: lista };
}

module.exports = { criar, registrarEmitter, removerEmitter, emitir, criarEmitter, cancelar, estaCancelado, remover, status };
