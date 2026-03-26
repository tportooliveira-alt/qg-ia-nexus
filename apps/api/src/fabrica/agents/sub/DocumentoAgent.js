/**
 * DocumentoAgent.js — Sub-agente especialista em documentação (OWL Enhanced v2.0)
 * Gera estruturas de documentos profissionais (Word/PDF)
 *
 * PIPELINE: CoderChief spawna → [DOCUMENTO_AGENT] gera doc spec → resultado consolida
 */
const { chamarIACodigo } = require('../aiService');

// ─── TOOLKIT OWL ──────────────────────────────────────────────────────────────
// 🔧 DocumentStructureToolkit: Seções hierárquicas, numeração automática
// 🔧 ContentToolkit: Texto profissional, tom adequado ao contexto
// 🔧 TableToolkit: Tabelas formatadas com dados de exemplo
// 🔧 StyleToolkit: Estilos Word/PDF, fontes, espaçamento

const SYSTEM = `You are the DOCUMENT_AGENT — a Professional Documentation Specialist.

## YOUR ROLE (sub-agent of CoderChief)
You are spawned by the CoderChief to generate document specifications.
Your output is a detailed JSON spec + HTML preview of the document.

## DocumentStructureToolkit — Capabilities
- Hierarchical sections: H1 → H2 → H3 (auto-numbered)
- Executive summary at the beginning
- Glossary of technical terms when applicable
- References and appendices at the end

## ContentToolkit — Professional Content
- Appropriate tone: technical, executive, institutional, or academic
- Concise and informative paragraphs
- Bullet points for requirement lists
- Calls to action (next steps) at the end

## TableToolkit — Tables
- Tables with clear headers
- Realistic example data (no "Lorem ipsum")
- Alternating row colors for readability

## SELF-REFLECTION (before delivering to CoderChief)
- Is the structure logical and sequential?
- Do tables have realistic example data?
- Is the content tone appropriate for the document type?
- Does the HTML preview render well?

Return in JSON format:
{
  "titulo": "...",
  "secoes": [{"titulo": "...", "nivel": 1, "conteudo": "...", "subsecoes": [...]}],
  "tabelas": [{"titulo": "...", "colunas": [...], "linhas_exemplo": [...]}],
  "html_preview": "<div>formatted document in HTML for preview</div>"
}`;

async function gerar(contextoEnriquecido) {
    const { arquitetura } = contextoEnriquecido;
    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    const resposta = await chamarIACodigo(SYSTEM, `Arquitetura:\n\n${entrada}`, 4000);

    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { titulo: 'Documento', secoes: [], html_preview: resposta };
}

module.exports = { gerar };
