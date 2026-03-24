/**
 * mcpService.js — MCP Client
 * Conecta a servidores MCP via stdio (JSON-RPC 2.0) e expõe suas ferramentas.
 */

const { spawn } = require('child_process');

const servers = new Map(); // name → { process, tools, buffers: { stdout, stderr } }

/** Envia uma mensagem JSON-RPC ao servidor e aguarda resposta por ID. */
function rpc(serverName, method, params = {}, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const s = servers.get(serverName);
    if (!s) return reject(new Error(`Servidor MCP "${serverName}" não encontrado`));

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';

    let pending = '';
    const onData = (chunk) => {
      pending += chunk.toString();
      const lines = pending.split('\n');
      pending = lines.pop(); // guarda linha incompleta
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === id) {
            s.process.stdout.off('data', onData);
            clearTimeout(timer);
            if (parsed.error) reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
            else resolve(parsed.result);
          }
        } catch { /* linha não é JSON — ignorar */ }
      }
    };

    const timer = setTimeout(() => {
      s.process.stdout.off('data', onData);
      reject(new Error(`Timeout (${timeoutMs}ms) ao chamar "${method}" em "${serverName}"`));
    }, timeoutMs);

    s.process.stdout.on('data', onData);
    s.process.stdin.write(msg);
  });
}

const McpService = {
  /**
   * Registra e inicia um servidor MCP por stdio.
   * Após iniciar, tenta listar as ferramentas disponíveis via tools/list.
   */
  async registerServer(name, command, args = []) {
    if (servers.has(name)) {
      console.log(`[MCP] Servidor "${name}" já registrado.`);
      return;
    }
    const proc = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    servers.set(name, { process: proc, tools: [], ready: false });
    console.log(`[MCP] Servidor "${name}" iniciado (pid ${proc.pid}).`);

    proc.on('error', (err) => console.warn(`[MCP] Erro no servidor "${name}":`, err.message));
    proc.on('close', (code) => {
      console.log(`[MCP] Servidor "${name}" encerrado (código ${code}).`);
      servers.delete(name);
    });

    // Aguarda 1s e tenta listar ferramentas
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const result = await rpc(name, 'tools/list');
      const s = servers.get(name);
      if (s) { s.tools = result?.tools || []; s.ready = true; }
      console.log(`[MCP] "${name}" pronto — ${s?.tools?.length || 0} ferramenta(s).`);
    } catch (err) {
      console.warn(`[MCP] Não foi possível listar tools de "${name}": ${err.message}`);
    }
  },

  /**
   * Invoca uma ferramenta MCP via tools/call (JSON-RPC 2.0).
   */
  invokeTool(serverName, toolName, toolArgs = {}) {
    return rpc(serverName, 'tools/call', { name: toolName, arguments: toolArgs });
  },

  listServers() {
    return Array.from(servers.entries()).map(([name, s]) => ({
      name,
      pid: s.process?.pid,
      ready: s.ready,
      tools: s.tools,
    }));
  },

  getTools(serverName) {
    return servers.get(serverName)?.tools || [];
  },

  isRunning(serverName) {
    return servers.has(serverName);
  },

  stopServer(serverName) {
    const s = servers.get(serverName);
    if (s) { s.process.kill(); servers.delete(serverName); }
  },

  stopAll() {
    for (const [name] of servers) this.stopServer(name);
  },
};

module.exports = McpService;
