const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

class ClawPythonEngine {
    constructor() {
        this.enginePath = path.join(__dirname, '..', 'engine-python', 'src', 'main.py');
        this.pythonPath = 'python';
    }

    async runCommand(command, prompt) {
        return new Promise((resolve, reject) => {
            const args = [this.enginePath, command, '--prompt', prompt];
            const process = spawn(this.pythonPath, args, {
                env: { ...process.env, PYTHONPATH: path.join(__dirname, '..', 'engine-python') }
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => { stdout += data.toString(); });
            process.stderr.on('data', (data) => { stderr += data.toString(); });

            process.on('close', (code) => {
                if (code === 0) resolve(stdout.trim());
                else reject(new Error(`Claw Engine failed with code ${code}: ${stderr}`));
            });
        });
    }

    async getSummary() { return this.runCommand('summary', ''); }
    async executeAgent(prompt) { return this.runCommand('run-turn-loop', prompt); }
}

module.exports = new ClawPythonEngine();
