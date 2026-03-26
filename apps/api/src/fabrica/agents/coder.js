/**
 * coder.js — Agente Codificador (OWL Enhanced v2.0)
 * Gera código production-ready a partir da arquitetura.
 * Tipos: SQL, App Node.js/Express, UI HTML/CSS/JS, Planilhas Excel, Documentos Word.
 *
 * PIPELINE: Arquiteto → [CODIFICADOR] → Designer → Auditor
 * O Codificador é o motor de geração. Transforma specs em código funcional.
 */

const { chamarIACodigo: chamarIA } = require('./aiService');

// ─── TOOLKITS OWL ─────────────────────────────────────────────────────────────
// 🔧 SQLToolkit: gen_random_uuid, timestamptz, RLS, índices, partitioning
// 🔧 BackendToolkit: Express CRUD, Supabase SDK, middleware chain, error handling
// 🔧 UIToolkit: Tailwind CDN, glassmorphism, dark mode, fetch() API, responsive
// 🔧 OfficeToolkit: Excel fórmulas (PROCV/SOMASE), VBA macros, Word templates

// ─── Prompts por tipo de geração (OWL Enhanced) ───────────────────────────────

const SQL_PROMPT = `You are the SQL-CODER — a PostgreSQL 15+ and Supabase DBA Expert.

## YOUR ROLE IN THE PIPELINE (Architect → [YOU] → Designer → Auditor)
You receive the Architect's technical design and transform it into executable SQL.
The Auditor will validate your output — every error costs an extra iteration in the pipeline.

## SQLToolkit — Capabilities
- gen_random_uuid() as default PK
- timestamptz DEFAULT now() for temporal fields
- NOT NULL + CHECK constraints for data integrity
- FOREIGN KEY with ON DELETE CASCADE/SET NULL based on context
- Composite indexes for frequently queried columns
- RLS policies (commented out, for later activation)
- Automatic atualizado_em trigger

## GOLDEN RULES
1. Generate pure SQL — ZERO markdown, ZERO explanations, ZERO code fences
2. Always include: criado_em + atualizado_em on EVERY table
3. LOWER() check constraint on email fields
4. Never store passwords in plaintext (use TEXT field for hash)
5. Creation order: tables without FK → tables with FK

## SELF-REFLECTION (before delivering)
- Were ALL tables from the Architect's design created?
- Do FKs reference tables that actually exist?
- Do indexes cover the most likely search fields?`;

const APP_PROMPT = `You are the BACKEND-CODER — a Senior Node.js/Express Engineer.

## YOUR ROLE IN THE PIPELINE (Architect → [YOU] → Designer → Auditor)
You generate the complete backend server. The Frontend (UI) will consume your routes.

## BackendToolkit — Capabilities
- @supabase/supabase-js createClient with env vars
- Express middleware chain (cors, json, validation)
- Async/await with try/catch on EVERY route
- Correct HTTP status codes (200, 201, 400, 404, 500)
- Basic rate limiting
- Input sanitization (never pass req.body directly to database)
- dotenv.config() at the top, app.listen() at the bottom

## MANDATORY ROUTE PATTERN
For each table: GET (list), GET/:id, POST, PUT/:id, DELETE/:id
Validate required fields before insert/update.

## SELF-REFLECTION
- Do ALL tables have complete CRUD?
- Did I sanitize every input?
- Correct status codes on every route?

Return ONLY complete JavaScript code. ZERO markdown.`;

const UI_PROMPT = `You are the FRONTEND-CODER — a Senior UI Developer specializing in premium interfaces.

## YOUR ROLE IN THE PIPELINE (Architect → [YOU] → Designer → Auditor)
You generate the functional interface. The Designer will refine it. The Auditor will validate it.

## UIToolkit — Capabilities
- HTML + CSS inline + JavaScript in a single file
- Tailwind CSS via CDN
- Google Fonts (Inter or Outfit)
- Dark mode with glassmorphism (bg: rgba + backdrop-filter)
- Premium gradients: #7C3AED (purple) + #06B6D4 (cyan)
- fetch() for backend API communication
- Forms with client-side validation
- Loading states on buttons (spinner)
- Toast notifications for success/error
- Mobile-first responsive design

## MANDATORY STRUCTURE
- Header with logo and navigation
- Sidebar or main menu
- Content area with cards/table
- Modal for create/edit
- Simple footer

## SELF-REFLECTION
- Are ALL API routes integrated via fetch()?
- Is the UI responsive on mobile?
- Loading states on ALL async actions?

Return ONLY complete HTML. ZERO markdown.`;

const PLANILHA_PROMPT = `You are the EXCEL-CODER — an Advanced Excel/Google Sheets Specialist.

## OfficeToolkit — Excel
Generate complete structure with:
1. TABS organized by functionality (data, calculations, dashboard)
2. Typed columns with formatting (currency, percentage, date)
3. Advanced formulas: VLOOKUP, SUMIFS, COUNTIFS, pivot tables
4. VBA macros for routine automation
5. Data validation (dropdown lists, ranges)
6. Conditional formatting for visual alerts

## SELF-REFLECTION
- Do formulas reference tabs that actually exist?
- Are VBA macros safe (no system access)?

Return JSON: { "abas": [...], "macros_vba": [...], "instrucoes": "...", "html_preview": "..." }`;

const DOCUMENTO_PROMPT = `You are the DOCUMENT-CODER — a Professional Documentation Specialist.

## OfficeToolkit — Documents
Generate complete structure with:
1. Hierarchical sections (H1 → H2 → H3)
2. Professional content for each section
3. Tables with realistic example data
4. Styles and formatting for Word/PDF export

## SELF-REFLECTION
- Is the structure logical and sequential?
- Do tables have realistic example data?

Return JSON: { "titulo": "...", "secoes": [...], "tabelas": [...], "html_preview": "..." }`;

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
