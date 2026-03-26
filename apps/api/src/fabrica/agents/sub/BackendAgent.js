/**
 * BackendAgent.js — Sub-agente especialista em Node.js/Express
 * Usa DeepSeek → Groq → Gemini
 * Gera backend completo e funcional com Supabase
 */
const { chamarIACodigo } = require('../aiService');

const SYSTEM = `Você é um engenheiro backend sênior especialista em Node.js + Express + Supabase.
Gere o código COMPLETO do servidor backend.

OBRIGATÓRIO incluir:
- require('@supabase/supabase-js') e createClient com env vars
- Todas as rotas CRUD para cada tabela da arquitetura
- Middleware de validação de entrada
- Tratamento de erros com try/catch em todas as rotas
- Rate limiting básico
- CORS configurado
- app.listen() no final
- dotenv.config() no início

SEGURANÇA obrigatória:
- Sanitizar inputs (nunca inserir req.body direto no banco)
- Validar campos obrigatórios antes de inserir
- HTTP status codes corretos (200, 201, 400, 404, 500)

Retorne APENAS o código JavaScript completo. Sem markdown, sem explicações.`;

async function gerar(contextoEnriquecido) {
    const { arquitetura, memorias_backend = [] } = contextoEnriquecido;

    let contextoPrev = '';
    if (memorias_backend.length > 0) {
        contextoPrev = '\n\nErros de backend a evitar:\n';
        memorias_backend.slice(0, 3).forEach(m => { contextoPrev += `- ${m.conteudo}\n`; });
    }

    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    return await chamarIACodigo(SYSTEM, `Arquitetura:${contextoPrev}\n\n${entrada}`, 4000);
}

module.exports = { gerar };
