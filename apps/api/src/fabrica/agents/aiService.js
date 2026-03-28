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
        chamar: async (system, user, maxTokens, opcoes = {}) => {
            // Roteamento por complexidade:
            // raciocinio/auditoria → claude-sonnet-4-6 (melhor)
            // tarefas rápidas     → claude-haiku-4-5-20251001 (rápido e barato)
            const modelo = opcoes.modelo || (
                opcoes.complexidade === 'alta' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001'
            );
            const body = JSON.stringify({
                model: modelo,
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
    },
    // ─── Novos provedores ────────────────────────────────────────────────────
    {
        nome: 'Mistral',
        ativo: () => !!process.env.MISTRAL_API_KEY,
        chamar: async (system, user, maxTokens) => {
            const body = JSON.stringify({
                model: 'mistral-large-latest',
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                max_tokens: maxTokens, temperature: 0.7
            });
            const resp = JSON.parse(await httpPost('https://api.mistral.ai/v1/chat/completions', body, {
                Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`
            }));
            return resp.choices?.[0]?.message?.content || '';
        }
    },
    {
        nome: 'Together',
        ativo: () => !!process.env.TOGETHER_API_KEY,
        chamar: async (system, user, maxTokens) => {
            const body = JSON.stringify({
                model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                max_tokens: maxTokens, temperature: 0.7
            });
            const resp = JSON.parse(await httpPost('https://api.together.xyz/v1/chat/completions', body, {
                Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`
            }));
            return resp.choices?.[0]?.message?.content || '';
        }
    },
    {
        nome: 'Fireworks',
        ativo: () => !!process.env.FIREWORKS_API_KEY,
        chamar: async (system, user, maxTokens) => {
            const body = JSON.stringify({
                model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                max_tokens: maxTokens, temperature: 0.7
            });
            const resp = JSON.parse(await httpPost('https://api.fireworks.ai/inference/v1/chat/completions', body, {
                Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`
            }));
            return resp.choices?.[0]?.message?.content || '';
        }
    },
    {
        nome: 'Cohere',
        ativo: () => !!process.env.COHERE_API_KEY,
        chamar: async (system, user, maxTokens) => {
            // Cohere usa API própria (Command R+) — ótimo para análise e embeddings
            const body = JSON.stringify({
                model: 'command-r-plus',
                message: user,
                preamble: system,
                max_tokens: maxTokens, temperature: 0.7
            });
            const resp = JSON.parse(await httpPost('https://api.cohere.com/v1/chat', body, {
                Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
                'X-Client-Name': 'qgia'
            }));
            return resp.text || '';
        }
    },
    {
        nome: 'SambaNova',
        ativo: () => !!process.env.SAMBANOVA_API_KEY,
        chamar: async (system, user, maxTokens) => {
            const body = JSON.stringify({
                model: 'Meta-Llama-3.3-70B-Instruct',
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                max_tokens: maxTokens, temperature: 0.7
            });
            const resp = JSON.parse(await httpPost('https://api.sambanova.ai/v1/chat/completions', body, {
                Authorization: `Bearer ${process.env.SAMBANOVA_API_KEY}`
            }));
            return resp.choices?.[0]?.message?.content || '';
        }
    }
];

// ─── Roteamento por especialidade ────────────────────────────────────────────
// Define qual provedor tentar PRIMEIRO para cada tipo de tarefa
// ─── Custo por provedor ────────────────────────────────────────────────────────
// 0 = grátis, 1 = muito barato, 2 = médio, 3 = caro
const CUSTO = {
    Groq:      0,  // grátis
    Cerebras:  0,  // grátis
    Gemini:    0,  // grátis (1500 req/dia)
    Fireworks: 0,  // grátis no tier gratuito
    Together:  1,  // muito barato
    SambaNova: 1,  // muito barato
    Mistral:   1,  // muito barato
    DeepSeek:  1,  // muito barato
    Cohere:    1,  // tem tier gratuito
    Anthropic: 3,  // PAGO — usar só quando necessário
    OpenAI:    3,  // PAGO — usar só quando necessário
};

// Cada especialidade tem ordem otimizada: GRÁTIS → BARATO → PAGO
const ROTAS_ESPECIALIDADE = {
    // Código: DeepSeek ótimo pra código e barato → Groq → Mistral → Together → PAGO só se falhar tudo
    codigo:     ['DeepSeek', 'Groq', 'Mistral', 'Together', 'Fireworks', 'SambaNova', 'Gemini', 'Cerebras', 'Anthropic', 'OpenAI'],
    // Rápido: sempre grátis primeiro
    rapido:     ['Groq', 'Cerebras', 'Fireworks', 'Gemini', 'Together', 'Mistral', 'SambaNova', 'DeepSeek', 'Anthropic', 'OpenAI'],
    // Raciocínio: começa com Mistral/Cohere (bons e baratos), Anthropic só no fim
    raciocinio: ['Mistral', 'Cohere', 'Gemini', 'Together', 'SambaNova', 'DeepSeek', 'Groq', 'Anthropic', 'OpenAI', 'Cerebras'],
    // Design: Gemini é o melhor e gratuito → resto
    design:     ['Gemini', 'Mistral', 'Together', 'Fireworks', 'SambaNova', 'DeepSeek', 'Groq', 'Cerebras', 'Anthropic', 'OpenAI'],
    // Análise: Cohere (especialista), Gemini, Mistral — PAGO só emergência
    analise:    ['Cohere', 'Gemini', 'Mistral', 'Together', 'SambaNova', 'DeepSeek', 'Groq', 'Cerebras', 'Anthropic', 'OpenAI'],
    // Pesquisa: modelos grandes e baratos
    pesquisa:   ['Together', 'SambaNova', 'Gemini', 'Groq', 'Mistral', 'Fireworks', 'Cohere', 'DeepSeek', 'Anthropic', 'OpenAI'],
    // Contexto longo: SambaNova e Together têm janelas grandes e são baratos
    contexto:   ['SambaNova', 'Together', 'Gemini', 'Mistral', 'Fireworks', 'Groq', 'DeepSeek', 'Cohere', 'Anthropic', 'OpenAI'],
    // Padrão: sempre grátis/barato primeiro
    padrao:     ['Groq', 'Gemini', 'Cerebras', 'Mistral', 'Together', 'Fireworks', 'SambaNova', 'DeepSeek', 'Cohere', 'Anthropic', 'OpenAI'],
    // Premium: usado pelo Auditor nas iterações finais — melhor qualidade disponível
    premium:    ['Anthropic', 'Mistral', 'Cohere', 'Gemini', 'Together', 'SambaNova', 'DeepSeek', 'Groq', 'Cerebras', 'OpenAI'],
};

// ─── Função principal com roteamento inteligente + cascata ─────────────────────
// nivel: 'economico' (só grátis/barato) | 'normal' (padrão) | 'premium' (melhor qualidade)
async function chamarIA(system, user, maxTokens = 2500, especialidade = 'padrao', nivel = 'normal') {
    let ordem = ROTAS_ESPECIALIDADE[especialidade] || ROTAS_ESPECIALIDADE.padrao;

    // Filtro por nível de custo
    if (nivel === 'economico') {
        // Só usa provedores grátis (custo 0)
        ordem = ordem.filter(nome => (CUSTO[nome] ?? 99) === 0);
        if (ordem.length === 0) ordem = ['Groq', 'Gemini', 'Cerebras']; // fallback mínimo
    } else if (nivel === 'premium') {
        // Usa a rota premium (Anthropic primeiro)
        ordem = ROTAS_ESPECIALIDADE.premium;
    }
    // nivel 'normal' usa a ordem padrão da especialidade

    const provedoresOrdenados = ordem
        .map(nome => PROVEDORES.find(p => p.nome === nome))
        .filter(p => p && p.ativo());

    if (provedoresOrdenados.length === 0) {
        throw new Error('Nenhum provedor de IA está configurado. Adicione chaves de API no .env');
    }

    const custoLabel = nivel === 'economico' ? '💚GRÁTIS' : nivel === 'premium' ? '💜PREMIUM' : '🔵NORMAL';
    const erros = [];

    for (const provedor of provedoresOrdenados) {
        try {
            console.log(`[IA/${especialidade}/${custoLabel}] Tentando ${provedor.nome}...`);
            const resultado = await provedor.chamar(system, user, maxTokens);
            if (resultado && resultado.trim().length > 0) {
                const custo = CUSTO[provedor.nome] ?? '?';
                console.log(`[IA/${especialidade}] ✅ ${provedor.nome} custo:${custo} (${resultado.length} chars)`);
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
// Aceita nivel opcional: 'economico' | 'normal' | 'premium'
const chamarIACodigo     = (s, u, t, nivel='normal')   => chamarIA(s, u, t, 'codigo',     nivel);
const chamarIARapido     = (s, u, t, nivel='economico') => chamarIA(s, u, t, 'rapido',     nivel);
const chamarIARaciocinio = (s, u, t, nivel='normal')   => chamarIA(s, u, t, 'raciocinio', nivel);
const chamarIADesign     = (s, u, t, nivel='normal')   => chamarIA(s, u, t, 'design',     nivel);
const chamarIAAnalise    = (s, u, t, nivel='normal')   => chamarIA(s, u, t, 'analise',    nivel);
const chamarIAPesquisa   = (s, u, t, nivel='economico') => chamarIA(s, u, t, 'pesquisa',   nivel);
const chamarIAContexto   = (s, u, t, nivel='economico') => chamarIA(s, u, t, 'contexto',   nivel);
const chamarIAPremium    = (s, u, t)                   => chamarIA(s, u, t, 'raciocinio', 'premium');

module.exports = {
    chamarIA,
    CUSTO,
    chamarIACodigo,
    chamarIAPremium,
    chamarIARapido,
    chamarIARaciocinio,
    chamarIADesign,
    chamarIAAnalise,
    chamarIAPesquisa,
    chamarIAContexto,
    listarProvedoresAtivos
};
