const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const McpService = require("../services/mcpService");

const router = Router();

// Listar servidores e ferramentas
router.get("/mcp/servers", autenticarToken, rateLimiter(30), (req, res) => {
  res.json({ status: "Sucesso", servers: McpService.listServers() });
});

// Iniciar servidor MCP
router.post("/mcp/servers", autenticarToken, rateLimiter(5), async (req, res) => {
  const { name, command, args } = req.body;
  if (!name || !command) return res.status(400).json({ error: "name e command são obrigatórios" });
  try {
    await McpService.registerServer(name, command, args || []);
    res.json({ status: "Sucesso", message: `Servidor MCP "${name}" iniciado.`, tools: McpService.getTools(name) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parar servidor MCP
router.delete("/mcp/servers/:name", autenticarToken, rateLimiter(10), (req, res) => {
  McpService.stopServer(req.params.name);
  res.json({ status: "Sucesso", message: `Servidor "${req.params.name}" encerrado.` });
});

// Invocar tool em um servidor MCP
router.post("/mcp/invoke", autenticarToken, rateLimiter(20), async (req, res) => {
  const { server, tool, args } = req.body;
  if (!server || !tool) return res.status(400).json({ error: "server e tool são obrigatórios" });
  try {
    const result = await McpService.invokeTool(server, tool, args || {});
    res.json({ status: "Sucesso", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
