/**
 * pipeline.routes.js — Rotas SSE do Pipeline
 *
 * POST /api/pipeline/iniciar    → cria pipeline, retorna ID imediatamente
 * GET  /api/pipeline/:id/stream → abre SSE, cliente recebe eventos em tempo real
 * POST /api/pipeline/:id/cancelar → cancela pipeline em execução
 * GET  /api/pipeline/status     → lista pipelines ativos
 */

const express        = require('express');
const router         = express.Router();
const PipelineManager = require('../core/PipelineManager');
const MasterOrchestrator = require('../core/MasterOrchestrator');

// Middleware: valida chave da fábrica
function verificarChave(req, res, next) {
    const chave = (req.headers['x-chave-fabrica'] || '').trim();
    const esperada = (process.env.CHAVE_SECRETA_DA_API || '').trim();
    if (!chave || chave !== esperada) {
        return res.status(401).json({ error: 'Chave da Fábrica inválida' });
    }
    next();
}

// ─── POST /api/pipeline/iniciar ───────────────────────────────────────────────
router.post('/iniciar', verificarChave, (req, res) => {
    const { ideia, usuario_id = 'anonimo' } = req.body;

    if (!ideia || String(ideia).trim().length < 5) {
        return res.status(400).json({ error: 'Ideia deve ter pelo menos 5 caracteres' });
    }

    // Gerar ID único para este pipeline
    const pipelineId = `pipe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
        PipelineManager.criar(pipelineId, usuario_id);
    } catch (e) {
        return res.status(503).json({ error: e.message });
    }

    // Retorna IMEDIATAMENTE com ID — não espera o pipeline terminar
    res.json({
        pipelineId,
        stream_url: `/api/pipeline/${pipelineId}/stream`,
        msg: 'Pipeline criado. Conecte ao stream_url para acompanhar em tempo real.'
    });

    // Executar pipeline em background (sem await)
    const emit = PipelineManager.criarEmitter(pipelineId);
    MasterOrchestrator.executar(ideia.trim(), pipelineId, usuario_id, emit)
        .then(() => PipelineManager.remover(pipelineId))
        .catch(err => {
            console.error(`[Pipeline ${pipelineId}] Erro fatal:`, err.message);
            PipelineManager.remover(pipelineId);
        });
});

// ─── GET /api/pipeline/:id/stream (SSE) ──────────────────────────────────────
router.get('/:id/stream', (req, res) => {
    const { id } = req.params;

    // Headers obrigatórios para SSE
    res.setHeader('Content-Type',  'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection',    'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Essencial no Render/Nginx

    // Permissão CORS para SSE
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Função que envia eventos SSE para este cliente
    const emitFn = (data) => {
        res.write(`data: ${data}\n\n`);
    };

    // Registrar este cliente no pipeline
    const registrado = PipelineManager.registrarEmitter(id, emitFn);

    if (!registrado) {
        // Pipeline não existe — pode ter concluído antes do cliente conectar
        res.write(`data: ${JSON.stringify({ tipo: 'pipeline_nao_encontrado', pipeline_id: id })}\n\n`);
        res.end();
        return;
    }

    // Heartbeat a cada 20s para manter conexão viva no Render
    const heartbeat = setInterval(() => {
        try { res.write(': heartbeat\n\n'); }
        catch (e) { clearInterval(heartbeat); }
    }, 20000);

    // Cleanup quando cliente desconecta
    req.on('close', () => {
        clearInterval(heartbeat);
        PipelineManager.removerEmitter(id, emitFn);
    });
});

// ─── POST /api/pipeline/:id/cancelar ─────────────────────────────────────────
router.post('/:id/cancelar', verificarChave, (req, res) => {
    const cancelado = PipelineManager.cancelar(req.params.id);
    if (cancelado) {
        res.json({ success: true, msg: 'Pipeline cancelado' });
    } else {
        res.status(404).json({ error: 'Pipeline não encontrado' });
    }
});

// ─── GET /api/pipeline/status ─────────────────────────────────────────────────
router.get('/status', (req, res) => {
    res.json(PipelineManager.status());
});

module.exports = router;
