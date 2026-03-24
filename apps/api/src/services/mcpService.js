/**
 * mcpService.js — MCP Client
 * Conecta a servidores MCP via stdio e expõe suas ferramentas.
 * Usa @modelcontextprotocol/sdk quando disponível.
 */

const { spawn } = require('child_process');

const servers = new Map(); // name → { process, tools }

const McpService = {
  /**
   * Registra e inicia um servidor MCP por stdio.
   * @param {string} name
   * @param {string} command  ex: "npx"
   * @param {string[]} args   ex: ["-y", "@modelcontextprotocol/server-brave-search"]
   */
  registerServer(name, command, args = []) {
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
  },

  listServers() {
    return Array.from(servers.entries()).map(([name, s]) => ({
      name,
      pid: s.process?.pid,
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
    if (s) {
      s.process.kill();
      servers.delete(serverName);
    }
  },

  stopAll() {
    for (const [name] of servers) this.stopServer(name);
  },
};

module.exports = McpService;
