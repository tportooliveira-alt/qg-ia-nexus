/**
 * tools.routes.js — Rotas de ferramentas do ToolExecutor
 *
 * Expõe as ferramentas disponíveis e permite execução via API.
 * Todas as rotas requerem autenticação.
 */

const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const ToolExecutor = require("../services/toolExecutor");

const router = Router();

// Listar ferramentas disponíveis
router.get("/tools", autenticarToken, rateLimiter(60), (req, res) => {
  res.json({
    status: "Sucesso",
    tools: ToolExecutor.TOOL_DEFINITIONS,
    total: ToolExecutor.TOOL_DEFINITIONS.length,
  });
});

// Executar uma ferramenta
router.post("/tools/execute", autenticarToken, rateLimiter(10), async (req, res) => {
  const { tool, args } = req.body;

  if (!tool) {
    return res.status(400).json({ error: "Campo 'tool' é obrigatório" });
  }

  try {
    const result = await ToolExecutor.executeTool(tool, args || {});
    res.json({ status: "Sucesso", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
