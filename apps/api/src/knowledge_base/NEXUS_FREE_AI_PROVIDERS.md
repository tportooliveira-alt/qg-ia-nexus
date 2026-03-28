# 🆓 Free AI Providers Catalog

## Catálogo de Provedores de IA com API Gratuita (2025-2026)

### Tier 1: Totalmente Gratuitos (uso ilimitado ou muito generoso)

#### Google AI Studio (Gemini)
- **URL**: https://generativelanguage.googleapis.com/v1beta/
- **Modelos**: gemini-2.5-flash-lite, gemini-2.0-flash, gemini-2.5-pro (preview)
- **Limites**: 1500 req/dia (flash), 50 req/dia (pro)
- **API Key**: https://aistudio.google.com/apikey
- **Formato**: REST custom (generateContent)
- **Stream**: ✅ SSE

#### Groq
- **URL**: https://api.groq.com/openai/v1/
- **Modelos**: llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
- **Limites**: 30 req/min, 14.4K tokens/min (70B)
- **API Key**: https://console.groq.com/keys
- **Formato**: OpenAI-compatible
- **Stream**: ✅

#### Cerebras
- **URL**: https://api.cerebras.ai/v1/
- **Modelos**: llama3.1-8b, llama3.1-70b
- **Limites**: ~30 req/min
- **API Key**: https://cloud.cerebras.ai/
- **Formato**: OpenAI-compatible
- **Stream**: ✅

#### SambaNova
- **URL**: https://api.sambanova.ai/v1/
- **Modelos**: Meta-Llama-3.3-70B-Instruct, DeepSeek-R1
- **Limites**: Generoso (developer tier)
- **API Key**: https://cloud.sambanova.ai/
- **Formato**: OpenAI-compatible
- **Stream**: ✅

### Tier 2: Free Tier Generoso

#### Together AI
- **URL**: https://api.together.xyz/v1/
- **Modelos**: meta-llama/Llama-3.3-70B-Instruct-Turbo, mistralai/Mixtral-8x7B
- **Limites**: $5 crédito gratuito no cadastro
- **API Key**: https://api.together.xyz/settings/api-keys
- **Formato**: OpenAI-compatible
- **Stream**: ✅
- **OBSERVAÇÃO**: Excelente para embeddings gratuitos também

#### Fireworks AI
- **URL**: https://api.fireworks.ai/inference/v1/
- **Modelos**: llama-v3p3-70b-instruct, mixtral-8x22b
- **Limites**: Free tier disponível
- **API Key**: https://fireworks.ai/api-keys
- **Formato**: OpenAI-compatible
- **Stream**: ✅

#### Mistral (Le Platforme)
- **URL**: https://api.mistral.ai/v1/
- **Modelos**: mistral-small-latest, open-mistral-nemo
- **Limites**: Free tier no início
- **API Key**: https://console.mistral.ai/api-keys
- **Formato**: OpenAI-compatible
- **Stream**: ✅

#### Cohere
- **URL**: https://api.cohere.ai/v2/
- **Modelos**: command-r-plus, command-r
- **Limites**: 1000 req/mês (free)
- **API Key**: https://dashboard.cohere.com/api-keys
- **Formato**: Custom REST
- **Stream**: ✅

#### HuggingFace Inference
- **URL**: https://api-inference.huggingface.co/models/
- **Modelos**: Qualquer modelo público no HF
- **Limites**: Rate limited, sem GPU dedicada (free)
- **API Key**: https://huggingface.co/settings/tokens
- **Formato**: Custom REST
- **Stream**: Parcial

#### Cloudflare Workers AI
- **URL**: Via Cloudflare Workers
- **Modelos**: @cf/meta/llama-3.1-8b-instruct, @cf/mistral/mistral-7b
- **Limites**: 10K tokens/dia (free)
- **API Key**: Via Cloudflare Dashboard
- **Formato**: REST custom
- **Stream**: ✅

### Tier 3: Preview/Beta Gratuito

#### OpenRouter (Free Models)
- **URL**: https://openrouter.ai/api/v1/
- **Modelos**: google/gemma-3, meta-llama/llama-3.3-70b (free routing)
- **Limites**: Modelos free têm rate limits
- **API Key**: https://openrouter.ai/keys
- **Formato**: OpenAI-compatible
- **NOTA**: Agrega muitos providers, alguns modelos são free

#### NVIDIA NIM
- **URL**: https://integrate.api.nvidia.com/v1/
- **Modelos**: meta/llama-3.1-405b-instruct, nvidia/llama-3.1-nemotron-70b
- **Limites**: 1000 chamadas grátis
- **API Key**: https://build.nvidia.com/
- **Formato**: OpenAI-compatible

## Como Integrar Novos Provedores

### Padrão OpenAI-Compatible (maioria)
```javascript
const res = await fetch("URL_DO_PROVIDER/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "NOME_DO_MODELO",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }]
  })
});
const data = await res.json();
return data.choices[0].message.content;
```

### Prioridade Recomendada para Cascata
1. Gemini (mais potente gratuito)
2. Groq (mais rápido)
3. Cerebras (backup rápido)
4. SambaNova (70B gratuito)
5. Together AI ($5 crédito)
6. Fireworks AI (backup)
7. Anthropic (pago, alta qualidade)
8. OpenAI (pago, universal)
