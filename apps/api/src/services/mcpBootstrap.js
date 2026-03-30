const McpService = require("./mcpService");

const MCP_SERVERS = [
  { name: "filesystem", command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "/root/qg-ia-nexus"], optional: true },
  { name: "memory", command: "npx", args: ["-y", "@modelcontextprotocol/server-memory"], optional: true }
];

async function bootstrapMcp() {
  console.log("[MCP-BOOT] Auto-registrando servidores MCP...");
  for (const srv of MCP_SERVERS) {
    try {
      await McpService.registerServer(srv.name, srv.command, srv.args);
      console.log("[MCP-BOOT] OK " + srv.name);
    } catch (err) {
      console.warn("[MCP-BOOT] SKIP " + srv.name + ": " + err.message);
    }
  }
  console.log("[MCP-BOOT] " + McpService.listServers().length + " servidor(es) ativo(s)");
  return McpService.listServers();
}

module.exports = { bootstrapMcp, MCP_SERVERS };
