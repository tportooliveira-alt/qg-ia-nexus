/**
 * BackendAgent.js — Sub-agente especialista em Node.js/Express (OWL Enhanced v2.0)
 * Usa DeepSeek → Groq → Gemini
 * Gera backend completo e funcional com Supabase
 *
 * PIPELINE: CoderChief spawna → [BACKEND_AGENT] gera servidor → resultado consolida
 */
const { chamarIACodigo } = require('../aiService');

// ─── TOOLKIT OWL ──────────────────────────────────────────────────────────────
// 🔧 ExpressCRUDToolkit: Rotas REST completas, middleware chain
// 🔧 SupabaseSDKToolkit: @supabase/supabase-js, queries otimizadas
// 🔧 SecurityToolkit: Input sanitization, rate limiting, CORS, auth
// 🔧 MemoryToolkit: Aprende com erros de backend anteriores

const SYSTEM = `You are the BACKEND_AGENT — a Senior Node.js/Express Engineer.

## YOUR ROLE (sub-agent of CoderChief)
You are spawned by the CoderChief to generate the complete backend.
The FrontendAgent will consume your routes. The Auditor will validate.

## ExpressCRUDToolkit — Capabilities
- require('@supabase/supabase-js') + createClient with env vars
- Complete CRUD per table: GET (list), GET/:id, POST, PUT/:id, DELETE/:id
- Input validation middleware on all routes
- try/catch on ALL async functions
- Correct HTTP status codes (200, 201, 400, 404, 500)
- dotenv.config() at the top, app.listen() at the bottom

## SecurityToolkit — Mandatory
- Sanitize ALL inputs (never insert req.body directly into database)
- Validate required fields before insert/update
- Basic rate limiting (express-rate-limit or manual)
- CORS configured for specific origins

## SELF-REFLECTION (before delivering to CoderChief)
- Do ALL architecture tables have complete CRUD?
- All inputs sanitized?
- Correct status codes on every route?
- Try/catch on every async operation?

Return ONLY complete JavaScript code. ZERO markdown, ZERO explanations.`;

async function gerar(contextoEnriquecido) {
    const { arquitetura, memorias_backend = [] } = contextoEnriquecido;

    // MemoryToolkit: Injetar erros anteriores
    let contextoPrev = '';
    if (memorias_backend.length > 0) {
        contextoPrev = '\n\nErros de backend a evitar (aprendizado anterior):\n';
        memorias_backend.slice(0, 3).forEach(m => { contextoPrev += `- ${m.conteudo}\n`; });
    }

    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    return await chamarIACodigo(SYSTEM, `Arquitetura:${contextoPrev}\n\n${entrada}`, 4000);
}

module.exports = { gerar };
