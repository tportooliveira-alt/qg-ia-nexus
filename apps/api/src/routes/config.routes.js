const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const BackupService = require("../services/backupService");
const fs = require("fs").promises;
const path = require("path");
const safeAudit = require("../utils/safeAudit");

const router = Router();

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

module.exports = router;
