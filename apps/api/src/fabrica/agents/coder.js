/**
 * coder.js — Agente Codificador
 * Gera código real a partir da arquitetura:
 * SQL, App Node.js/Express, UI HTML/CSS/JS,
 * fórmulas Excel, estrutura Word, etc.
 */

const { chamarIACodigo: chamarIA } = require('./aiService'); // Codificador usa especialista em código (DeepSeek→Groq)

// ─── Prompts por tipo de geração ──────────────────────────────────────────────

const SQL_PROMPT = `Você é um DBA expert em PostgreSQL e Supabase.
Gere o SQL COMPLETO para criar todas as tabelas da arquitetura fornecida.
Use: gen_random_uuid(), timestamptz, NOT NULL, PRIMARY KEY, FOREIGN KEY, índices.
Retorne SOMENTE o código SQL puro. Sem markdown, sem explicações.`;

const APP_PROMPT = `Você é um programador Node.js/Express sênior.
Gere o código COMPLETO do backend: todas as rotas CRUD usando @supabase/supabase-js.
Use async/await, tratamento de erros, validação de entrada.
Inclua: require, configuração do Supabase, todas as rotas, app.listen.
Retorne SOMENTE o código JavaScript. Sem markdown, sem explicações.`;

const UI_PROMPT = `Você é um designer/frontend sênior especialista em interfaces premium.
Gere uma interface HTML completa: HTML + CSS inline + JavaScript tudo em 1 arquivo.
Use: glassmorphism, dark mode, gradientes roxo/ciano, Tailwind CDN, fetch() para API.
Interface totalmente funcional com formulários, listagem e interatividade.
Retorne SOMENTE o código HTML completo. Sem markdown, sem explicações.`;

const PLANILHA_PROMPT = `Você é um especialista em Excel/Google Sheets.
Com base na arquitetura fornecida, gere:
1. Estrutura detalhada de todas as ABAS com nomes e propósitos
2. Colunas de cada aba com tipos de dados e formatação
3. Fórmulas importantes (PROCV, SOMASE, tabelas dinâmicas, etc.)
4. Macros VBA sugeridas para automatização
5. Instruções de uso

Retorne em formato JSON:
{
  "abas": [{"nome": "...", "descricao": "...", "colunas": [...], "formulas": [...]}],
  "macros_vba": [{"nome": "...", "codigo": "...", "descricao": "..."}],
  "instrucoes": "passo a passo de como usar",
  "html_preview": "<table>...</table> com exemplo visual das abas principais"
}`;

const DOCUMENTO_PROMPT = `Você é um especialista em documentação profissional (Word/PDF).
Com base na arquitetura fornecida, gere a estrutura completa do documento:
1. Todas as seções e subseções
2. Conteúdo sugerido para cada seção
3. Tabelas e campos a preencher
4. Estilos e formatação recomendada

Retorne em formato JSON:
{
  "titulo": "...",
  "secoes": [{"titulo": "...", "nivel": 1, "conteudo": "...", "subsecoes": [...]}],
  "tabelas": [{"titulo": "...", "colunas": [...], "linhas_exemplo": [...]}],
  "html_preview": "<div>documento formatado em HTML para preview</div>"
}`;

// ─── Funções de geração ───────────────────────────────────────────────────────

async function gerarSQL(arquitetura) {
    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    return await chamarIA(SQL_PROMPT, `Arquitetura:\n${entrada}`, 3000);
}

async function gerarApp(arquitetura) {
    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    return await chamarIA(APP_PROMPT, `Arquitetura:\n${entrada}`, 4000);
}

async function gerarUI(arquitetura) {
    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    return await chamarIA(UI_PROMPT, `Arquitetura:\n${entrada}`, 4000);
}

async function gerarPlanilha(arquitetura) {
    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    const resposta = await chamarIA(PLANILHA_PROMPT, `Arquitetura:\n${entrada}`, 4000);
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { instrucoes: resposta, abas: [], macros_vba: [] };
}

async function gerarDocumento(arquitetura) {
    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    const resposta = await chamarIA(DOCUMENTO_PROMPT, `Arquitetura:\n${entrada}`, 4000);
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { titulo: 'Documento', secoes: [], html_preview: resposta };
}

async function corrigir(arquitetura, problemas) {
    const prompt = `Corrija o código com base nestes problemas encontrados pelo Auditor:\n\nProblemas:\n${problemas.map(p => `- [${p.gravidade}] ${p.local}: ${p.descricao}`).join('\n')}\n\nArquitetura original:\n${JSON.stringify(arquitetura, null, 2)}`;
    return {
        sql: await gerarSQL(arquitetura),
        app: await gerarApp(arquitetura),
        ui: await gerarUI(arquitetura)
    };
}

module.exports = { gerarSQL, gerarApp, gerarUI, gerarPlanilha, gerarDocumento, corrigir };
