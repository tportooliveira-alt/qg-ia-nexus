const { Router } = require("express");
const { autenticarToken } = require("../services/authMiddleware");
const fs = require("fs").promises;
const path = require("path");

const router = Router();

router.post("/skills/factory", autenticarToken, async (req, res) => {
  try {
    const { nome, papel, icone, descricao } = req.body;
    const nomeSanitizado = nome.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!nomeSanitizado || nomeSanitizado.length < 2) {
      return res.status(400).json({ error: "Nome do agente inválido. Use apenas letras, números, - e _." });
    }
    const caminhoSeguro = path.join(__dirname, "..", "skills", "agentes", `${nomeSanitizado}.json`);
    const novoAgente = { nome: nomeSanitizado, icone: icone || "🤖", papel, descricao, criado_em: new Date().toISOString() };
    await fs.writeFile(caminhoSeguro, JSON.stringify(novoAgente, null, 2), "utf-8");
    res.json({ status: "Sucesso", message: `Agente ${nomeSanitizado} fabricado!` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
