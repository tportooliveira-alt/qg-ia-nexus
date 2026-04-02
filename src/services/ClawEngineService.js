const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

class ClawPythonEngine {
    constructor() {
        this.enginePath = path.join(__dirname, '..', 'engine-python', 'src', 'main.py');
        this.pythonPath = 'python';
        this.queue = [];
        this.isProcessing = false;
    }

    async runCommand(command, prompt) {
        return new Promise((resolve, reject) => {
            const taskId = Math.random().toString(36).substring(7);
            console.log(`[🛡️ QUEUE] Adicionada tarefa ${taskId}. Fila: ${this.queue.length + 1}`);
            this.queue.push({ command, prompt, resolve, reject, taskId });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;
        const { command, prompt, resolve, reject, taskId } = this.queue.shift();

        console.log(`[🤖 TACTICAL] Processando ${taskId}...`);
        try {
            const args = [this.enginePath, command, '--prompt', prompt];
            const process = spawn(this.pythonPath, args, {
                env: { ...process.env, PYTHONPATH: path.join(__dirname, '..', 'engine-python') }
            });
            let stdout = '', stderr = '';
            process.stdout.on('data', (d) => stdout += d);
            process.stderr.on('data', (d) => stderr += d);
            process.on('close', (code) => {
                this.isProcessing = false;
                if (code === 0) resolve(stdout.trim());
                else reject(new Error(`Claw Engine failed: ${stderr}`));
                this.processQueue();
            });
        } catch (e) {
            this.isProcessing = false;
            reject(e);
            this.processQueue();
        }
    }

    async getSummary() { return this.runCommand('summary', ''); }
    async executeAgent(prompt) { return this.runCommand('run-turn-loop', prompt); }
}

module.exports = new ClawPythonEngine();
