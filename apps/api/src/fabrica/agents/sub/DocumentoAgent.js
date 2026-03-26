/**
 * DocumentoAgent.js — Sub-agente especialista em documentos Word/PDF/Markdown
 */
const { chamarIARaciocinio } = require('../aiService');

const SYSTEM = `Você é especialista em documentação profissional (Word, PDF, Markdown).
Gere um documento completo e profissional.

Retorne SOMENTE JSON válido com esta estrutura:
{
  "titulo": "Título do Documento",
  "subtitulo": "Subtítulo opcional",
  "tipo": "relatorio|proposta|contrato|manual|especificacao|outro",
  "secoes": [
    {
      "titulo": "1. Nome da Seção",
      "nivel": 1,
      "conteudo": "Texto completo da seção com detalhes...",
      "subsecoes": [
        { "titulo": "1.1 Subseção", "nivel": 2, "conteudo": "..." }
      ]
    }
  ],
  "tabelas": [
    {
      "titulo": "Tabela de Exemplo",
      "colunas": ["Col1", "Col2", "Col3"],
      "linhas": [["dado1", "dado2", "dado3"]]
    }
  ],
  "notas_rodape": ["Nota 1", "Nota 2"],
  "html_preview": "<div style='font-family:Georgia;max-width:800px;margin:0 auto;padding:40px'>...</div>"
}`;

async function gerar(contextoEnriquecido) {
    const { arquitetura } = contextoEnriquecido;
    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    const resposta = await chamarIARaciocinio(SYSTEM, `Arquitetura:\n${entrada}`, 4000);
    const match = resposta.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { titulo: 'Documento', secoes: [], html_preview: resposta };
}

module.exports = { gerar };
