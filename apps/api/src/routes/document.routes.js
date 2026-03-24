/**
 * Rotas de Documentos e Mídia
 *
 * POST /api/docs/ler-pdf          — Extrai texto de PDF (upload ou base64)
 * POST /api/docs/ler-excel        — Lê planilha Excel, retorna JSON
 * POST /api/docs/criar-excel      — Cria arquivo Excel a partir de dados JSON
 * POST /api/docs/ler-word         — Extrai texto de documento Word
 * POST /api/docs/criar-word       — Cria documento Word (.docx)
 * GET  /api/docs/sheets/ler       — Lê Google Sheets
 * POST /api/docs/sheets/escrever  — Escreve no Google Sheets
 * POST /api/docs/sheets/acrescentar — Adiciona linhas no Sheets
 * POST /api/docs/sheets/criar     — Cria nova planilha Google
 * POST /api/docs/video/criar      — Cria vídeo curto com slides
 * GET  /api/docs/video/status/:id — Status de render (Shotstack)
 */

const { Router } = require("express");
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");
const os     = require("os");

const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const DocService   = require("../services/documentService");
const VideoService = require("../services/videoService");

const router  = Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const UPLOADS = path.join(os.tmpdir(), "qgia-docs");
fs.mkdirSync(UPLOADS, { recursive: true });

// ─── PDF ─────────────────────────────────────────────────────────────────────

router.post("/ler-pdf", autenticarToken, rateLimiter(10), upload.single("arquivo"), async (req, res) => {
  try {
    let buffer;
    if (req.file) {
      buffer = req.file.buffer;
    } else if (req.body.base64) {
      buffer = Buffer.from(req.body.base64, "base64");
    } else {
      return res.status(400).json({ error: "Envie arquivo (multipart) ou campo 'base64'" });
    }
    const resultado = await DocService.lerPDF(buffer);
    res.json({ ok: true, ...resultado });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── EXCEL ───────────────────────────────────────────────────────────────────

router.post("/ler-excel", autenticarToken, rateLimiter(10), upload.single("arquivo"), async (req, res) => {
  try {
    const buffer = req.file?.buffer;
    if (!buffer) return res.status(400).json({ error: "Envie o arquivo Excel (multipart)" });
    const resultado = DocService.lerExcel(buffer);
    res.json({ ok: true, ...resultado });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/criar-excel", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const { dados, nome_arquivo } = req.body;
    if (!dados || typeof dados !== "object") {
      return res.status(400).json({ error: "Campo 'dados' obrigatório: { 'Aba1': [...linhas] }" });
    }
    const buffer = DocService.criarExcel(dados);
    const nome   = (nome_arquivo || "planilha").replace(/[^a-z0-9_-]/gi, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${nome}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── WORD ─────────────────────────────────────────────────────────────────────

router.post("/ler-word", autenticarToken, rateLimiter(10), upload.single("arquivo"), async (req, res) => {
  try {
    const buffer = req.file?.buffer;
    if (!buffer) return res.status(400).json({ error: "Envie o arquivo Word (multipart)" });
    const resultado = await DocService.lerWord(buffer);
    res.json({ ok: true, ...resultado });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/criar-word", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const { conteudo, nome_arquivo } = req.body;
    if (!conteudo) return res.status(400).json({ error: "Campo 'conteudo' obrigatório (string ou array)" });
    const buffer = await DocService.criarWord(conteudo, null);
    const nome   = (nome_arquivo || "documento").replace(/[^a-z0-9_-]/gi, "_");
    res.setHeader("Content-Disposition", `attachment; filename="${nome}.docx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.send(buffer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GOOGLE SHEETS ────────────────────────────────────────────────────────────

router.get("/sheets/ler", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const { id, intervalo } = req.query;
    if (!id) return res.status(400).json({ error: "Parâmetro 'id' (spreadsheetId) obrigatório" });
    const resultado = await DocService.lerGoogleSheets(id, intervalo);
    res.json({ ok: true, ...resultado });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/sheets/escrever", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const { id, intervalo, linhas } = req.body;
    if (!id || !linhas) return res.status(400).json({ error: "Campos 'id', 'linhas' obrigatórios" });
    const resultado = await DocService.escreverGoogleSheets(id, intervalo || "Sheet1!A1", linhas);
    res.json({ ok: true, ...resultado });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/sheets/acrescentar", autenticarToken, rateLimiter(10), async (req, res) => {
  try {
    const { id, intervalo, linhas } = req.body;
    if (!id || !linhas) return res.status(400).json({ error: "Campos 'id', 'linhas' obrigatórios" });
    const resultado = await DocService.acrescentarGoogleSheets(id, intervalo || "Sheet1!A1", linhas);
    res.json({ ok: true, ...resultado });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/sheets/criar", autenticarToken, rateLimiter(5), async (req, res) => {
  try {
    const { titulo, dados } = req.body;
    if (!titulo) return res.status(400).json({ error: "Campo 'titulo' obrigatório" });
    const resultado = await DocService.criarGoogleSheet(titulo, dados || []);
    res.json({ ok: true, ...resultado });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── VÍDEO ────────────────────────────────────────────────────────────────────

router.post("/video/criar", autenticarToken, rateLimiter(3), async (req, res) => {
  try {
    const { slides, opcoes } = req.body;
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({
        error: "Campo 'slides' obrigatório: array de { titulo, texto, cor, corTexto }",
      });
    }
    const resultado = await VideoService.criarVideo(slides, null, opcoes || {});
    // Se retornou um path local (FFmpeg), envia o arquivo
    if (typeof resultado === "string" && fs.existsSync(resultado)) {
      res.setHeader("Content-Disposition", `attachment; filename="video_qgia.mp4"`);
      res.setHeader("Content-Type", "video/mp4");
      const stream = fs.createReadStream(resultado);
      stream.pipe(res);
      stream.on("end", () => { try { fs.unlinkSync(resultado); } catch {} });
    } else {
      // Retorno de API cloud (Shotstack)
      res.json({ ok: true, ...resultado });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/video/status/:id", autenticarToken, rateLimiter(20), async (req, res) => {
  try {
    const resultado = await VideoService.statusVideoShotstack(req.params.id);
    res.json({ ok: true, ...resultado });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
