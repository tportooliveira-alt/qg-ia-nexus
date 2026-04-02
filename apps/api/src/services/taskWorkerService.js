const { v4: uuidv4 } = require('uuid');
const MasterOrchestrator = require('../fabrica/core/MasterOrchestrator');
const PipelineManager = require('../fabrica/core/PipelineManager');
const MemoryService = require('./memoryService');

/**
 * TaskWorkerService — O Motor de Jato do Nexus Claw.
 * Gerencia a execução de tarefas em background sem travar o sistema.
 */
class TaskWorkerService {
    constructor() {
        this.tasks = new Map(); // Em cache local para acesso rápido
        this.isRunning = false;
        this.loopInterval = null;
    }

    /**
     * Inicia a turbina do Worker
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('[TASK-WORKER] 🚀 Motor de Jato iniciado. Aguardando missões...');
        
        // Loop de verificação a cada 30 segundos
        this.loopInterval = setInterval(() => this.processNextTask(), 30000);
    }

    /**
     * Adiciona uma nova missão à fila de autonomia
     */
    async addMission(type, idea, userId, metadata = {}) {
        const taskId = `task_${uuidv4().split('-')[0]}`;
        const task = {
            id: taskId,
            type, // 'build', 'research', 'audit', 'continuous_learning'
            idea,
            userId,
            status: 'pending',
            progress: 0,
            createdAt: new Date().toISOString(),
            metadata
        };

        this.tasks.set(taskId, task);
        
        // Registra na memória persistente
        await MemoryService.registrar({
            agente: 'MasterOrchestrator',
            categoria: 'task_mission',
            conteudo: `Missão "${type}" agendada: ${idea.slice(0, 100)}...`,
            projeto: 'Nexus-Autonomy'
        });

        console.log(`[TASK-WORKER] 🎯 Nova missão registrada: ${taskId} (${type})`);
        return taskId;
    }

    /**
     * Processa a próxima tarefa pendente
     */
    async processNextTask() {
        const pending = Array.from(this.tasks.values()).find(t => t.status === 'pending');
        if (!pending) return;

        pending.status = 'running';
        pending.startedAt = new Date().toISOString();
        console.log(`[TASK-WORKER] ⚡ Executando missão: ${pending.id}...`);

        try {
            // Se for uma tarefa de 'build' da fábrica de IA
            if (pending.type === 'build') {
                const pipelineId = `p_${pending.id}`;
                const emitter = PipelineManager.criarEmitter(pipelineId);

                // Execução real pelo Orquestrador Mestre
                await MasterOrchestrator.executar(pending.idea, pipelineId, pending.userId, (event) => {
                    // Update local progress based on events
                    if (event.progresso) pending.progress = event.progresso;
                    console.log(`[TASK-WORKER][${pending.id}] ${event.mensagem || event.tipo}`);
                });
            }

            pending.status = 'completed';
            pending.completedAt = new Date().toISOString();
            console.log(`[TASK-WORKER] ✅ Missão concluída com sucesso: ${pending.id}`);

        } catch (err) {
            pending.status = 'error';
            pending.error = err.message;
            console.error(`[TASK-WORKER] ❌ Falha na missão ${pending.id}:`, err.message);
        }
    }

    getStatus(taskId) {
        return this.tasks.get(taskId) || null;
    }
}

// Singleton
const worker = new TaskWorkerService();
worker.start();

module.exports = worker;
