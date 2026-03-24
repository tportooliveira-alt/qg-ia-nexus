const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const McpService = require("../services/mcpService");

const router = Router();

// Listar servidores e ferramentas
router.get("/mcp/tools", autenticarToken, rateLimiter(30), (req, res) => {
  res.json({ status: "Sucesso", servers: McpService.listServers() });
});

// Iniciar servidor MCP
router.post("/mcp/servers", autenticarToken, rateLimiter(5), (req, res) => {
  const { name, command, args } = req.body;
  if (!name || !command) return res.status(400).json({ error: "name e command são obrigatórios" });
  try {
    McpService.registerServer(name, command, args || []);
    res.json({ status: "Sucesso", message: `Servidor MCP "${name}" iniciado.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parar servidor MCP
router.delete("/mcp/servers/:name", autenticarToken, rateLimiter(10), (req, res) => {
  McpService.stopServer(req.params.name);
  res.json({ status: "Sucesso", message: `Servidor "${req.params.name}" encerrado.` });
});

module.exports = router;
