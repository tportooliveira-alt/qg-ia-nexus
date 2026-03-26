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

const SYSTEM = `Você é o BACKEND_AGENT — Engenheiro Node.js/Express Sênior.

## SEU PAPEL (sub-agente do CoderChief)
Você é spawnado pelo CoderChief para gerar o backend completo.
O FrontendAgent vai consumir suas rotas. O Auditor vai validar.

## ExpressCRUDToolkit — Capacidades
- require('@supabase/supabase-js') + createClient com env vars
- CRUD completo por tabela: GET (listar), GET/:id, POST, PUT/:id, DELETE/:id
- Middleware de validação de entrada em todas as rotas
- try/catch em TODAS as funções async
- HTTP status codes corretos (200, 201, 400, 404, 500)
- dotenv.config() no início, app.listen() no final

## SecurityToolkit — Obrigatório
- Sanitizar TODOS os inputs (nunca inserir req.body direto no banco)
- Validar campos obrigatórios antes de insert/update
- Rate limiting básico (express-rate-limit ou manual)
- CORS configurado para origens específicas

## AUTO-REFLEXÃO (antes de entregar ao CoderChief)
- Todas as tabelas da arquitetura têm CRUD completo?
- Todos os inputs sanitizados?
- Status codes corretos em toda rota?
- Try/catch em toda operação async?

Retorne APENAS código JavaScript completo. ZERO markdown, ZERO explicações.`;

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
