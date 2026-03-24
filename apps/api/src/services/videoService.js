/**
 * VideoService — Criação de vídeos curtos com FFmpeg + slides de imagem.
 *
 * Estratégia:
 *   1. Recebe um array de "slides" (texto + cor de fundo)
 *   2. Gera imagens PNG de cada slide com Canvas (ou HTML via Puppeteer)
 *   3. Usa fluent-ffmpeg para montar os slides num vídeo MP4
 *
 * Requer: ffmpeg instalado no servidor (apt install ffmpeg)
 * Para Hostinger: usa API Shotstack se SHOTSTACK_API_KEY estiver definida
 */

const fs   = require("fs");
const path = require("path");
const os   = require("os");

const TEMP_DIR = path.join(os.tmpdir(), "qgia-videos");

// ─── Shotstack (cloud) ────────────────────────────────────────────────────────

async function criarVideoShotstack(slides, opcoes = {}) {
  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (!apiKey) throw new Error("SHOTSTACK_API_KEY não definido no .env");

  const fetch = require("node-fetch");
  const duracao = opcoes.duracao || 3; // segundos por slide

  const clips = slides.map((slide, i) => ({
    asset: {
      type: "html",
      html: `<div style="background:${slide.cor || "#1a1a2e"};width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:40px;box-sizing:border-box;">
               <p style="color:${slide.corTexto || "#ffffff"};font-size:${slide.tamanhoFonte || 48}px;font-family:Arial;text-align:center;font-weight:bold;">${slide.texto || ""}</p>
             </div>`,
      width: 1280,
      height: 720,
    },
    start: i * duracao,
    length: duracao,
    transition: { in: "fade", out: "fade" },
  }));

  const timeline = {
    soundtrack: opcoes.musica ? { src: opcoes.musica, effect: "fadeOut" } : undefined,
    tracks: [{ clips }],
  };

  const output = {
    format: "mp4",
    resolution: opcoes.resolucao || "hd",
    fps: opcoes.fps || 30,
  };

  const body = { timeline, output };
  const res  = await fetch("https://api.shotstack.io/v1/render", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Shotstack error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { id: data.response.id, status: "processando", provedor: "Shotstack" };
}

async function statusVideoShotstack(renderId) {
  const apiKey = process.env.SHOTSTACK_API_KEY;
  const fetch  = require("node-fetch");
  const res    = await fetch(`https://api.shotstack.io/v1/render/${renderId}`, {
    headers: { "x-api-key": apiKey },
  });
  const data = await res.json();
  return {
    status: data.response.status,
    url: data.response.url || null,
    progresso: data.response.data?.progress || 0,
  };
}

// ─── FFmpeg local ─────────────────────────────────────────────────────────────

async function _slideParaImagem(slide, indice) {
  // Cria um HTML + usa Puppeteer se disponível, ou fallback para texto simples
  const dir = TEMP_DIR;
  fs.mkdirSync(dir, { recursive: true });

  const htmlPath = path.join(dir, `slide_${indice}.html`);
  const imgPath  = path.join(dir, `slide_${indice}.png`);

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body {
    width:1280px;height:720px;overflow:hidden;
    background:${slide.cor || "#1a1a2e"};
    display:flex;align-items:center;justify-content:center;
    padding:60px;
  }
  .conteudo { text-align:center; }
  h1 { color:${slide.corTexto || "#1EE0E0"};font-size:${slide.tamanhoTitulo || 56}px;font-family:Arial,sans-serif;margin-bottom:20px; }
  p  { color:${slide.corTexto || "#ffffff"};font-size:${slide.tamanhoFonte  || 32}px;font-family:Arial,sans-serif;line-height:1.5; }
</style>
</head><body>
<div class="conteudo">
  ${slide.titulo ? `<h1>${slide.titulo}</h1>` : ""}
  <p>${(slide.texto || "").replace(/\n/g, "<br>")}</p>
</div>
</body></html>`;

  fs.writeFileSync(htmlPath, html, "utf8");

  // Tenta usar Puppeteer para capturar como PNG
  try {
    const puppeteer = require("puppeteer");
    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page    = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto("file://" + htmlPath);
    await page.screenshot({ path: imgPath });
    await browser.close();
    return imgPath;
  } catch {
    // Fallback: usa FFmpeg para gerar slide de texto puro
    return null;
  }
}

async function criarVideoFFmpeg(slides, destino, opcoes = {}) {
  const ffmpeg = require("fluent-ffmpeg");
  const duracao = opcoes.duracao || 3;
  const fps     = opcoes.fps || 24;

  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const imagens = [];
  for (let i = 0; i < slides.length; i++) {
    const img = await _slideParaImagem(slides[i], i);
    imagens.push(img);
  }

  // Se não conseguiu gerar imagens com Puppeteer, usa lavfi drawtext
  if (imagens.every(img => img === null)) {
    // Gera vídeo texto puro com FFmpeg drawtext
    return new Promise((resolve, reject) => {
      const parts = [];
      for (let i = 0; i < slides.length; i++) {
        const texto = (slides[i].titulo || slides[i].texto || "").replace(/'/g, "\\'").replace(/:/g, "\\:").slice(0, 80);
        parts.push(
          `[0:v]drawtext=text='${texto}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,${i * duracao},${(i + 1) * duracao})'[v${i}]`
        );
      }
      const bgColor = slides[0]?.cor || "#1a1a2e";
      const cmd     = ffmpeg()
        .input(`color=${bgColor.replace("#", "0x")}:size=1280x720:rate=${fps}:duration=${slides.length * duracao}`)
        .inputOptions(["-f", "lavfi"])
        .outputOptions(["-c:v", "libx264", "-pix_fmt", "yuv420p"])
        .output(destino)
        .on("end", () => resolve(destino))
        .on("error", reject);
      cmd.run();
    });
  }

  // Monta vídeo com imagens geradas
  return new Promise((resolve, reject) => {
    const listaPath = path.join(TEMP_DIR, "lista.txt");
    const lista     = imagens
      .filter(Boolean)
      .map(img => `file '${img.replace(/\\/g, "/")}'\nduration ${duracao}`)
      .join("\n");
    fs.writeFileSync(listaPath, lista + "\n");

    ffmpeg()
      .input(listaPath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", `fps=${fps}`])
      .output(destino)
      .on("end", () => {
        // Limpa temporários
        imagens.filter(Boolean).forEach(f => { try { fs.unlinkSync(f); } catch {} });
        resolve(destino);
      })
      .on("error", reject)
      .run();
  });
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

async function criarVideo(slides, destino, opcoes = {}) {
  if (process.env.SHOTSTACK_API_KEY) {
    return criarVideoShotstack(slides, opcoes);
  }
  return criarVideoFFmpeg(slides, destino || path.join(TEMP_DIR, `video_${Date.now()}.mp4`), opcoes);
}

module.exports = {
  criarVideo,
  criarVideoShotstack,
  criarVideoFFmpeg,
  statusVideoShotstack,
};
