const { Router } = require("express");
const { autenticarToken, validarPath } = require("../services/authMiddleware");
const BackupService = require("../services/backupService");
const fs = require("fs").promises;
const path = require("path");

const router = Router();

const PASTAS_PERMITIDAS = [
  path.resolve(__dirname, "..", ".."),            // raiz de apps/api
  path.resolve(__dirname, "..", "..", "src"),
  path.resolve(__dirname, "..", "..", "public"),
];

router.get("/fs/ler", autenticarToken, validarPath(PASTAS_PERMITIDAS), async (req, res) => {
  try {
    const content = await fs.readFile(req.pathSeguro, "utf-8");
    res.json({ content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/fs/escrever", autenticarToken, validarPath(PASTAS_PERMITIDAS), async (req, res) => {
  try {
    const { content } = req.body;
    await BackupService.criarSnapshot(req.pathSeguro);
    await fs.writeFile(req.pathSeguro, content, "utf-8");
    res.json({ status: "Sucesso", message: "Snapshot criado e arquivo salvo." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
