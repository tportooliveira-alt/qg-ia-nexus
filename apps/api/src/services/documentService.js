/**
 * DocumentService — Leitura/escrita de PDF, Excel, Word e Google Sheets
 * Usado pelos agentes para processar e gerar documentos automaticamente.
 */

const fs   = require("fs");
const path = require("path");

// ─── PDF ─────────────────────────────────────────────────────────────────────

async function lerPDF(caminhoOuBuffer) {
  const pdfParse = require("pdf-parse");
  const buffer = Buffer.isBuffer(caminhoOuBuffer)
    ? caminhoOuBuffer
    : fs.readFileSync(caminhoOuBuffer);
  const data = await pdfParse(buffer);
  return {
    texto: data.text,
    paginas: data.numpages,
    info: data.info || {},
    tamanho: buffer.length,
  };
}

// ─── EXCEL ───────────────────────────────────────────────────────────────────

function lerExcel(caminhoOuBuffer) {
  const XLSX = require("xlsx");
  const wb = XLSX.read(caminhoOuBuffer, {
    type: Buffer.isBuffer(caminhoOuBuffer) ? "buffer" : "file",
  });
  const resultado = {};
  for (const aba of wb.SheetNames) {
    resultado[aba] = XLSX.utils.sheet_to_json(wb.Sheets[aba], { defval: "" });
  }
  return { abas: wb.SheetNames, dados: resultado };
}

function criarExcel(dadosAbas, destino = null) {
  const XLSX = require("xlsx");
  const wb = XLSX.utils.book_new();
  for (const [nomeAba, linhas] of Object.entries(dadosAbas)) {
    const ws = XLSX.utils.json_to_sheet(linhas);
    XLSX.utils.book_append_sheet(wb, ws, nomeAba.slice(0, 31));
  }
  if (destino) {
    XLSX.writeFile(wb, destino);
    return destino;
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// ─── WORD ─────────────────────────────────────────────────────────────────────

async function lerWord(caminhoOuBuffer) {
  const mammoth = require("mammoth");
  const opcoes  = Buffer.isBuffer(caminhoOuBuffer)
    ? { buffer: caminhoOuBuffer }
    : { path: caminhoOuBuffer };
  const result = await mammoth.extractRawText(opcoes);
  const html   = await mammoth.convertToHtml(opcoes);
  return { texto: result.value, html: html.value };
}

async function criarWord(conteudo, destino) {
  const { Document, Paragraph, TextRun, HeadingLevel, Packer } = require("docx");

  const paragrafos = [];
  if (typeof conteudo === "string") {
    // Converte texto simples: linhas vazias viram parágrafos
    for (const linha of conteudo.split("\n")) {
      if (linha.startsWith("# ")) {
        paragrafos.push(new Paragraph({ text: linha.slice(2), heading: HeadingLevel.HEADING_1 }));
      } else if (linha.startsWith("## ")) {
        paragrafos.push(new Paragraph({ text: linha.slice(3), heading: HeadingLevel.HEADING_2 }));
      } else {
        paragrafos.push(new Paragraph({ children: [new TextRun(linha)] }));
      }
    }
  } else if (Array.isArray(conteudo)) {
    // Array de { tipo: 'titulo'|'paragrafo', texto }
    for (const item of conteudo) {
      if (item.tipo === "titulo") {
        paragrafos.push(new Paragraph({ text: item.texto, heading: HeadingLevel.HEADING_1 }));
      } else if (item.tipo === "subtitulo") {
        paragrafos.push(new Paragraph({ text: item.texto, heading: HeadingLevel.HEADING_2 }));
      } else {
        paragrafos.push(new Paragraph({ children: [new TextRun(item.texto || "")] }));
      }
    }
  }

  const doc = new Document({ sections: [{ children: paragrafos }] });
  const buffer = await Packer.toBuffer(doc);
  if (destino) {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, buffer);
    return destino;
  }
  return buffer;
}

// ─── GOOGLE SHEETS ────────────────────────────────────────────────────────────

function _getSheetsClient() {
  const { google } = require("googleapis");
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON não definido no .env");
  const creds = JSON.parse(credJson);
  const auth  = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function lerGoogleSheets(spreadsheetId, intervalo = "Sheet1!A1:Z1000") {
  const sheets = _getSheetsClient();
  const res    = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: intervalo,
  });
  const linhas  = res.data.values || [];
  if (linhas.length === 0) return { cabecalho: [], dados: [] };
  const cabecalho = linhas[0];
  const dados     = linhas.slice(1).map((row) =>
    Object.fromEntries(cabecalho.map((col, i) => [col, row[i] || ""]))
  );
  return { cabecalho, dados, total: dados.length };
}

async function escreverGoogleSheets(spreadsheetId, intervalo, linhas) {
  const sheets = _getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: intervalo,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: linhas },
  });
  return { ok: true, linhas_escritas: linhas.length };
}

async function acrescentarGoogleSheets(spreadsheetId, intervalo, linhas) {
  const sheets = _getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: intervalo,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: linhas },
  });
  return { ok: true, linhas_adicionadas: linhas.length };
}

async function criarGoogleSheet(titulo, dados = []) {
  const { google } = require("googleapis");
  const credJson   = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON não definido no .env");
  const creds = JSON.parse(credJson);
  const auth  = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const res    = await sheets.spreadsheets.create({
    requestBody: { properties: { title: titulo } },
  });
  const id = res.data.spreadsheetId;
  if (dados.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: dados },
    });
  }
  return { spreadsheetId: id, url: `https://docs.google.com/spreadsheets/d/${id}` };
}

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = {
  lerPDF,
  lerExcel,
  criarExcel,
  lerWord,
  criarWord,
  lerGoogleSheets,
  escreverGoogleSheets,
  acrescentarGoogleSheets,
  criarGoogleSheet,
};
