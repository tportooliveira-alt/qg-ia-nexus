/**
 * SecurityAgent.js — Sub-agente especialista em Segurança (OWASP)
 *
 * CASCATA: Anthropic (melhor análise) → Groq → Gemini
 * Analisa o código gerado e produz relatório + código corrigido
 *
 * PIPELINE: CoderChief spawna → [SECURITY_AGENT] audita → resultado consolida
 */
const { chamarIAAnalise } = require('../aiService');

// ─── TOOLKIT ──────────────────────────────────────────────────────────────────
// 🔧 OWASPToolkit: Top 10 vulnerabilidades mais comuns
// 🔧 SanitizationToolkit: Verifica SQL injection, XSS, command injection
// 🔧 AuthToolkit: Verifica JWT, CORS, rate limiting, headers HTTP
// 🔧 SecureCodeToolkit: Reescreve trechos inseguros

const SYSTEM = `You are the SECURITY_AGENT — a Senior Application Security Engineer specializing in OWASP Top 10.

## YOUR ROLE (sub-agent of CoderChief)
You are spawned to analyze the generated architecture and produce:
1. A security analysis report (JSON format)
2. A list of hardened code snippets for critical vulnerabilities

## OWASPToolkit — What to check:
- A01: Broken Access Control — missing auth checks, IDOR
- A02: Cryptographic Failures — plain text passwords, weak hashing
- A03: Injection — SQL injection, command injection, XSS via inputs
- A04: Insecure Design — missing input validation, no rate limiting
- A05: Security Misconfiguration — debug mode on prod, verbose errors
- A07: Auth Failures — weak JWT, no expiry, no refresh tokens
- A09: Logging Failures — no audit trail, logging sensitive data

## Output Format — Return ONLY this JSON:
{
  "score_seguranca": 0-100,
  "nivel_risco": "baixo|medio|alto|critico",
  "vulnerabilidades": [
    {
      "categoria": "OWASP A03",
      "descricao": "SQL injection possible in user input",
      "gravidade": "alta",
      "linha_estimada": "POST /users route",
      "correcao": "Use parameterized queries: db.query('SELECT * FROM users WHERE id = $1', [id])"
    }
  ],
  "recomendacoes": [
    "Adicionar helmet.js para headers HTTP seguros",
    "Implementar rate limiting por IP com express-rate-limit",
    "Sanitizar todos os inputs com express-validator"
  ],
  "codigo_seguro_adicional": "// Middleware de segurança recomendado\\nconst helmet = require('helmet');\\napp.use(helmet());\\n// ..."
}

Return ONLY the JSON object. No markdown, no explanations.`;

async function gerar(contextoEnriquecido) {
    const { arquitetura } = contextoEnriquecido;

    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);

    const resposta = await chamarIAAnalise(
        SYSTEM,
        `Analise a segurança desta arquitetura e código gerado:\n\n${entrada}`,
        2000
    );

    // Tentar parsear JSON — se falhar retorna estrutura mínima
    try {
        const jsonMatch = resposta.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (_) { /* segue em frente */ }

    return {
        score_seguranca: 70,
        nivel_risco: 'medio',
        vulnerabilidades: [],
        recomendacoes: ['Adicionar helmet.js', 'Validar todos os inputs'],
        codigo_seguro_adicional: resposta
    };
}

module.exports = { gerar };
