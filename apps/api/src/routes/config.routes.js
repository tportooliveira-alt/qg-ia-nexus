const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const BackupService = require("../services/backupService");
const fs = require("fs").promises;
const path = require("path");
const safeAudit = require("../utils/safeAudit");

const router = Router();

// Mapa: nome amigável → variável de ambiente
const CHAVES_API = {
  gemini:    "GEMINI_API_KEY",
  groq:      "GROQ_API_KEY",
  cerebras:  "CEREBRAS_API_KEY",
  sambanovo: "SAMBANOVA_API_KEY",
  deepseek:  "DEEPSEEK_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openai:    "OPENAI_API_KEY",
  xai:       "XAI_API_KEY",
};

async function atualizarEnv(chave, valor) {
  const envPath = path.join(__dirname, "..", "..", ".env");
  let content = await fs.readFile(envPath, "utf-8").catch(() => "");
  const linha = `${chave}=${valor}`;
  if (content.includes(`${chave}=`)) {
    content = content.replace(new RegExp(`^${chave}=.*$`, "m"), linha);
  } else {
    content = content.trimEnd() + `\n${linha}\n`;
  }
  await BackupService.criarSnapshot(envPath);
  await fs.writeFile(envPath, content, "utf-8");
}

function mascarar(valor) {
  if (!valor || valor.length < 8) return valor ? "****" : "";
  return valor.slice(0, 6) + "****" + valor.slice(-4);
}

// POST /api/config/token-volume
router.post("/config/token-volume", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const { volume } = req.body;
    const v = String(volume || "").toLowerCase();
    if (!["eco", "normal", "power"].includes(v)) {
      return res.status(400).json({ error: "volume invalido (eco|normal|power)" });
    }
    process.env.TOKEN_VOLUME = v;
    await atualizarEnv("TOKEN_VOLUME", v);
    await safeAudit({ agente: "NexusClaw", acao: "config_token_volume", status: "ok", detalhe: { volume: v }, origem: "api" });
    res.json({ status: "Sucesso", token_volume: v });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/config/api-keys — retorna status mascarado das chaves
router.get("/config/api-keys", autenticarToken, rateLimiter(20), (req, res) => {
  const resultado = {};
  for (const [nome, envVar] of Object.entries(CHAVES_API)) {
    const valor = process.env[envVar] || "";
    resultado[nome] = {
      env_var: envVar,
      configurada: valor.length > 0,
      mascara: mascarar(valor),
      token_volume: process.env.TOKEN_VOLUME || "normal",
    };
  }
  res.json({ status: "Sucesso", chaves: resultado, token_volume: process.env.TOKEN_VOLUME || "normal" });
});

// POST /api/config/api-key — atualiza uma chave de API
router.post("/config/api-key", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const { provider, chave } = req.body;
    if (!provider || !chave) {
      return res.status(400).json({ error: "provider e chave são obrigatórios" });
    }
    const providerKey = String(provider).toLowerCase();
    const envVar = CHAVES_API[providerKey];
    if (!envVar) {
      return res.status(400).json({ error: `Provider desconhecido: ${provider}. Use: ${Object.keys(CHAVES_API).join(", ")}` });
    }
    const valorLimpo = String(chave).trim();
    if (valorLimpo.length < 8) {
      return res.status(400).json({ error: "Chave muito curta (mínimo 8 caracteres)" });
    }
    // Atualiza process.env imediatamente (sem reiniciar)
    process.env[envVar] = valorLimpo;
    // Persiste no .env para sobreviver a restarts
    await atualizarEnv(envVar, valorLimpo);
    await safeAudit({
      agente: "NexusClaw", acao: "config_api_key", status: "ok",
      detalhe: { provider: providerKey, env_var: envVar }, origem: "api"
    });
    res.json({ status: "Sucesso", provider: providerKey, env_var: envVar, mascara: mascarar(valorLimpo) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
