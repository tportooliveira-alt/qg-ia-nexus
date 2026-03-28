/**
 * aiService.js — Serviço de IA com Roteamento Inteligente + Cascata
 *
 * Cada IA é usada para o que faz de MELHOR:
 *  - codigo  → DeepSeek (especialista em código) → Groq → Gemini
 *  - rapido  → Groq (ultra-rápido, grátis) → Gemini
 *  - raciocinio → Anthropic (melhor raciocínio) → OpenAI → Gemini
 *  - design  → Gemini (melhor multimodal) → Anthropic
 *  - padrao  → Gemini (grátis) → Groq → Anthropic → OpenAI → DeepSeek → Cerebras
 */

const https = require('https');
const http = require('http');

// ─── Helper HTTP ───────────────────────────────────────────────────────────────
function httpPost(url, body, headers) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const lib = isHttps ? https : http;

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers }
        };

        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
                }
            });
        });

        req.setTimeout(45000, () => {
            req.destroy();
            reject(new Error('Timeout após 45s'));
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ─── Provedores de IA ──────────────────────────────────────────────────────────
const PROVEDORES = [
    {
        nome: 'Gemini',
        ativo: () => !!(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2),
        chamar: async (system, user, maxTokens, opcoes = {}) => {
            // Rodízio automático de chaves — evita 429 por limite de quota
            // Alterna entre GEMINI_API_KEY e GEMINI_API_KEY_2 se disponíveis
            const chaves = [
                process.env.GEMINI_API_KEY,
                process.env.GEMINI_API_KEY_2,
                process.env.GEMINI_API_KEY_3,
            ].filter(Boolean);

            if (chaves.length === 0) throw new Error('Nenhuma chave Gemini configurada');

            const modelo = opcoes.modelo || (
                opcoes.complexidade === 'complexa' ? 'gemini-2.5-flash' : 'gemini-2.0-flash'
            );

            const errosGemini = [];
            for (const chave of chaves) {
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${chave}`;
                    const body = JSON.stringify({
                        contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
                        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
                    });
                    const resp = JSON.parse(await httpPost(url, body, {}));
                    const texto = resp.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    if (texto) return texto;
                    throw new Error('Resposta vazia');
                } catch (err) {
                    const msg = err.message?.substring(0, 100) || '';
                    errosGemini.push(`chave${chaves.indexOf(chave)+1}: ${msg}`);
                    // Se for 429 (rate limit), tenta próxima chave
                    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
                        console.warn(`[Gemini] 429 na chave ${chaves.indexOf(chave)+1}, tentando próxima...`);
                        continue;
                    }
                    throw err; // Outro erro — não adianta tentar outra chave
                }
            }
            throw new Error(`Todas as chaves Gemini falharam: ${errosGemini.join(' | ')}`);
        }
    },
    {
        nome: 'Groq',
        ativo: () => !!process.env.GROQ_API_KEY,
        chamar: async (system, user, maxTokens) => {
            const body = JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                max_tokens: maxTokens, temperature: 0.7
            });
            const resp = JSON.parse(await httpPost('https://api.groq.com/openai/v1/chat/completions', body, {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`
            }));
            return resp.choices?.[0]?.message?.content || '';
        }
    },
    {
        nome: 'Anthropic',
        ativo: () => !!process.env.ANTHROPIC_API_KEY,
        chamar: async (system, user, maxTokens) => {
            const body = JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: maxTokens,
                system: system,
                messages: [{ role: 'user', content: user }]
            });
            const resp = JSON.parse(await httpPost('https://api.anthropic.com/v1/messages', body, {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            }));
            return resp.content?.[0]?.text || '';
        }
    },
    {
        nome: 'OpenAI',
        ativo: () => !!process.env.OPENAI_API_KEY,
        chamar: async (system, user, maxTokens) => {
            const body = JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                max_tokens: maxTokens, temperature: 0.7
            });
            const resp = JSON.parse(await httpPost('https://api.openai.com/v1/chat/completions', body, {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
            }));
            return resp.choices?.[0]?.message?.content || '';
        }
    },
    {
        nome: 'DeepSeek',
        ativo: () => !!process.env.DEEPSEEK_API_KEY,
        chamar: async (system, user, maxTokens) => {
            const body = JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                max_tokens: maxTokens, temperature: 0.7
            });
            const resp = JSON.parse(await httpPost('https://api.deepseek.com/v1/chat/completions', body, {
                Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`
            }));
            return resp.choices?.[0]?.message?.content || '';
        }
    },
    {
        nome: 'Cerebras',
        ativo: () => !!process.env.CEREBRAS_API_KEY,
        chamar: async (system, user, maxTokens) => {
            const body = JSON.stringify({
                model: 'llama3.1-8b',
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                max_tokens: maxTokens
            });
            const resp = JSON.parse(await httpPost('https://api.cerebras.ai/v1/chat/completions', body, {
                Authorization: `Bearer ${process.env.CEREBRAS_API_KEY}`
            }));
            return resp.choices?.[0]?.message?.content || '';
        }
    }
];

// ─── Roteamento por especialidade ────────────────────────────────────────────
// Define qual provedor tentar PRIMEIRO para cada tipo de tarefa
const ROTAS_ESPECIALIDADE = {
    codigo:      ['DeepSeek', 'Groq', 'Anthropic', 'Gemini', 'OpenAI', 'Cerebras'],
    rapido:      ['Groq', 'Cerebras', 'Gemini', 'DeepSeek', 'Anthropic', 'OpenAI'],
    raciocinio:  ['Anthropic', 'OpenAI', 'Gemini', 'DeepSeek', 'Groq', 'Cerebras'],
    design:      ['Gemini', 'Anthropic', 'OpenAI', 'DeepSeek', 'Groq', 'Cerebras'],
    analise:     ['Anthropic', 'Gemini', 'OpenAI', 'DeepSeek', 'Groq', 'Cerebras'],
    padrao:      ['Gemini', 'Groq', 'Anthropic', 'OpenAI', 'DeepSeek', 'Cerebras']
};

// ─── Função principal com roteamento inteligente + cascata ─────────────────────
async function chamarIA(system, user, maxTokens = 2500, especialidade = 'padrao') {
    const ordem = ROTAS_ESPECIALIDADE[especialidade] || ROTAS_ESPECIALIDADE.padrao;
    const provedoresOrdenados = ordem
        .map(nome => PROVEDORES.find(p => p.nome === nome))
        .filter(p => p && p.ativo());

    if (provedoresOrdenados.length === 0) {
        throw new Error('Nenhum provedor de IA está configurado. Adicione chaves de API no .env');
    }

    const erros = [];

    for (const provedor of provedoresOrdenados) {
        try {
            console.log(`[IA/${especialidade}] Tentando ${provedor.nome}...`);
            const resultado = await provedor.chamar(system, user, maxTokens);
            if (resultado && resultado.trim().length > 0) {
                console.log(`[IA/${especialidade}] ✅ ${provedor.nome} (${resultado.length} chars)`);
                return resultado;
            }
        } catch (err) {
            const msg = `${provedor.nome}: ${err.message?.substring(0, 100)}`;
            console.warn(`[IA/${especialidade}] ⚠️ ${msg}`);
            erros.push(msg);
        }
    }

    throw new Error(`Nenhum provedor respondeu para [${especialidade}]. Erros: ${erros.join(' | ')}`);
}

function listarProvedoresAtivos() {
    return PROVEDORES.filter(p => p.ativo()).map(p => p.nome);
}

// Atalhos por especialidade (usados pelos agentes)
const chamarIACodigo     = (s, u, t) => chamarIA(s, u, t, 'codigo');
const chamarIARapido     = (s, u, t) => chamarIA(s, u, t, 'rapido');
const chamarIARaciocinio = (s, u, t) => chamarIA(s, u, t, 'raciocinio');
const chamarIADesign     = (s, u, t) => chamarIA(s, u, t, 'design');
const chamarIAAnalise    = (s, u, t) => chamarIA(s, u, t, 'analise');

module.exports = {
    chamarIA,
    chamarIACodigo,
    chamarIARapido,
    chamarIARaciocinio,
    chamarIADesign,
    chamarIAAnalise,
    listarProvedoresAtivos
};
