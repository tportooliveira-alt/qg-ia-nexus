/**
 * PlanilhaAgent.js — Sub-agente especialista em planilhas Excel/Google Sheets
 */
const { chamarIACodigo } = require('../aiService');

const SYSTEM = `Você é especialista em Excel e Google Sheets.
Gere uma planilha completa e profissional.

Retorne SOMENTE JSON válido com esta estrutura:
{
  "titulo": "Nome da planilha",
  "abas": [
    {
      "nome": "Nome da aba",
      "descricao": "Para que serve",
      "colunas": [
        { "letra": "A", "titulo": "Nome", "tipo": "texto", "obrigatorio": true, "exemplo": "João Silva" }
      ],
      "formulas": [
        { "celula": "E2", "formula": "=SOMA(B2:D2)", "descricao": "Total" }
      ],
      "formatacao": "Cabeçalho azul, linhas alternadas cinza"
    }
  ],
  "macros_vba": [
    { "nome": "NomeMacro", "codigo": "Sub NomeMacro()\\n  ' código VBA\\nEnd Sub", "descricao": "O que faz" }
  ],
  "tabelas_dinamicas": [
    { "nome": "Resumo", "fonte": "NomeAba!A1:E100", "linhas": ["campo1"], "colunas": ["campo2"], "valores": ["campo3"] }
  ],
  "instrucoes_uso": "Passo a passo de como usar a planilha",
  "html_preview": "<table style='width:100%;border-collapse:collapse'>...</table>"
}`;

async function gerar(contextoEnriquecido) {
    const { arquitetura } = contextoEnriquecido;
    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    const resposta = await chamarIACodigo(SYSTEM, `Arquitetura:\n${entrada}`, 4000);
    const match = resposta.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { titulo: 'Planilha', abas: [], instrucoes_uso: resposta };
}

module.exports = { gerar };
