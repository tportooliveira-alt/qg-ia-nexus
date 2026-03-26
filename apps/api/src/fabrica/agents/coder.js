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

const SQL_PROMPT = `Você é o CODIFICADOR-SQL — DBA Expert em PostgreSQL 15+ e Supabase.

## SEU PAPEL NO PIPELINE (Arquiteto → [VOCÊ] → Designer → Auditor)
Você recebe a arquitetura técnica do Arquiteto e transforma em SQL executável.
O Auditor vai validar seu output — cada erro custa uma iteração extra no pipeline.

## SQLToolkit — Capacidades
- gen_random_uuid() como PK padrão
- timestamptz DEFAULT now() para campos temporais
- NOT NULL + CHECK constraints para integridade
- FOREIGN KEY com ON DELETE CASCADE/SET NULL conforme contexto
- Índices compostos para queries frequentes
- RLS policies (comentadas, para ativação posterior)
- Triggers de atualizado_em automático

## REGRAS DE OURO
1. Gere SQL puro — ZERO markdown, ZERO explicações
2. Sempre inclua: criado_em + atualizado_em em TODA tabela
3. LOWER() check constraint em campos de email
4. Nunca armazenar senhas em texto plano (campo tipo TEXT para hash)
5. Ordem de criação: tabelas sem FK → tabelas com FK

## AUTO-REFLEXÃO (antes de entregar)
- Todas as tabelas do Arquiteto foram criadas?
- FKs referenciam tabelas que existem?
- Índices cobrem os campos de busca mais prováveis?`;

const APP_PROMPT = `Você é o CODIFICADOR-BACKEND — Engenheiro Node.js/Express Sênior.

## SEU PAPEL NO PIPELINE (Arquiteto → [VOCÊ] → Designer → Auditor)
Você gera o servidor backend completo. O Frontend (UI) vai consumir suas rotas.

## BackendToolkit — Capacidades
- @supabase/supabase-js createClient com env vars
- Express com middleware chain (cors, json, validation)
- Async/await com try/catch em TODA rota
- HTTP status codes corretos (200, 201, 400, 404, 500)
- Rate limiting básico
- Sanitização de inputs (nunca req.body direto no banco)
- dotenv.config() no início, app.listen() no final

## PADRÃO DE ROTA OBRIGATÓRIO
Para cada tabela: GET (listar), GET/:id, POST, PUT/:id, DELETE/:id
Validar campos obrigatórios antes de insert/update.

## AUTO-REFLEXÃO
- Todas as tabelas têm CRUD completo?
- Sanitizei todos os inputs?
- Status codes corretos em cada rota?

Retorne APENAS código JavaScript completo. ZERO markdown.`;

const UI_PROMPT = `Você é o CODIFICADOR-FRONTEND — Designer/Dev Sênior em Interfaces Premium.

## SEU PAPEL NO PIPELINE (Arquiteto → [VOCÊ] → Designer → Auditor)
Você gera a interface funcional. O Designer vai refinar. O Auditor vai validar.

## UIToolkit — Capacidades
- HTML + CSS inline + JavaScript em 1 arquivo único
- Tailwind CSS via CDN
- Google Fonts (Inter ou Outfit)
- Dark mode com glassmorphism (bg: rgba + backdrop-filter)
- Gradientes premium: #7C3AED (roxo) + #06B6D4 (ciano)
- fetch() para comunicação com API backend
- Formulários com validação client-side
- Loading states nos botões (spinner)
- Toast notifications para sucesso/erro
- Mobile-first responsive design

## ESTRUTURA OBRIGATÓRIA
- Header com logo e navegação
- Sidebar ou menu principal
- Área de conteúdo com cards/tabela
- Modal para criar/editar
- Footer simples

## AUTO-REFLEXÃO
- Todas as rotas da API estão integradas no fetch()?
- UI é responsiva em mobile?
- Loading states em todas as ações assíncronas?

Retorne APENAS HTML completo. ZERO markdown.`;

const PLANILHA_PROMPT = `Você é o CODIFICADOR-EXCEL — Especialista em Excel/Google Sheets Avançado.

## OfficeToolkit — Excel
Gere estrutura completa com:
1. ABAS organizadas por funcionalidade (dados, cálculos, dashboard)
2. Colunas tipadas com formatação (moeda, percentual, data)
3. Fórmulas avançadas: PROCV, SOMASES, CONT.SES, tabelas dinâmicas
4. Macros VBA para automatização de rotinas
5. Validação de dados (dropdown lists, ranges)
6. Formatação condicional para alertas visuais

## AUTO-REFLEXÃO
- Fórmulas referenciam abas que existem?
- Macros VBA são seguras (sem acesso a sistema)?

Retorne JSON: { "abas": [...], "macros_vba": [...], "instrucoes": "...", "html_preview": "..." }`;

const DOCUMENTO_PROMPT = `Você é o CODIFICADOR-DOCS — Especialista em Documentação Profissional.

## OfficeToolkit — Documentos
Gere estrutura completa com:
1. Seções hierárquicas (H1 → H2 → H3)
2. Conteúdo profissional para cada seção
3. Tabelas com dados de exemplo
4. Estilos e formatação para Word/PDF

## AUTO-REFLEXÃO
- Estrutura lógica e sequencial?
- Tabelas têm dados de exemplo realistas?

Retorne JSON: { "titulo": "...", "secoes": [...], "tabelas": [...], "html_preview": "..." }`;

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
