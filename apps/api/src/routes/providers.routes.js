const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const AIService = require("../services/aiService");

const router = Router();

// Prompt mínimo de teste — verifica se cada provider responde
const PROMPT_TESTE = "Responda apenas: OK";

async function testarProvider(nome, fn) {
  const inicio = Date.now();
  try {
    const resultado = await Promise.race([
      fn(PROMPT_TESTE, 20),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout 15s")), 15000))
    ]);
    return { nome, status: "ok", latencia_ms: Date.now() - inicio, resposta: String(resultado || "").slice(0, 80) };
  } catch (err) {
    return { nome, status: "erro", latencia_ms: Date.now() - inicio, erro: err.message.slice(0, 120) };
  }
}

// GET /api/providers/status — testa todos os providers em paralelo
router.get("/providers/status", autenticarToken, rateLimiter(5), async (req, res) => {
  const testes = [
    testarProvider("Gemini",    (p, t) => AIService.callGemini(p, t)),
    testarProvider("Groq",      (p, t) => AIService.callGroq(p, t)),
    testarProvider("Cerebras",  (p, t) => AIService.callCerebras(p, t)),
    testarProvider("DeepSeek",  (p, t) => AIService.callDeepSeek(p, t)),
    testarProvider("SambaNova", (p, t) => AIService.callSambaNova(p, t)),
    testarProvider("xAI",       (p, t) => AIService.callxAI(p, t)),
    testarProvider("Anthropic", (p, t) => AIService.callAnthropic(p, t)),
    testarProvider("OpenAI",    (p, t) => AIService.callOpenAI(p, t)),
  ];

  const resultados = await Promise.all(testes);
  const ok = resultados.filter(r => r.status === "ok").length;
  const total = resultados.length;

  res.json({
    status: ok > 0 ? "Sucesso" : "Todos com erro",
    providers_ok: ok,
    providers_total: total,
    resultados,
    testado_em: new Date().toISOString(),
  });
});

module.exports = router;
