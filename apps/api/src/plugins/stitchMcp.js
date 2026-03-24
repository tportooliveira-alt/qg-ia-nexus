const fetch = require("node-fetch");

function authHeaders() {
  const apiKey = process.env.STITCH_API_KEY;
  if (!apiKey) throw new Error("STITCH_API_KEY ausente no .env");
  return { "X-Goog-Api-Key": apiKey };
}

function baseUrl() {
  return process.env.STITCH_BASE_URL || "https://stitch.googleapis.com/mcp";
}

/**
 * Baixa a tela em HTML completo.
 */
async function fetchScreenHtml(projectId, screenId) {
  const url = `${baseUrl()}/projects/${projectId}/screens/${screenId}/html`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Stitch HTML status ${res.status}`);
  return res.text();
}

/**
 * Baixa a tela em imagem (Buffer).
 */
async function fetchScreenImage(projectId, screenId) {
  const url = `${baseUrl()}/projects/${projectId}/screens/${screenId}/image`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Stitch image status ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = {
  fetchScreenHtml,
  fetchScreenImage
};
