# Mapa Exato de Infra, Front, Bancos e IAs (QG IA Nexus)

## 1) Hospedagem (configurada no repositório)

### Backend principal
- Plataforma: Render
- Serviço: `qg-ia-nexus`
- Arquivo de deploy: `render.yaml`
- Start command: `node server.js`
- Health check: `/api/status`
- Host alvo: `https://qg-ia-nexus.onrender.com`

### Integração externa de pipeline
- Serviço externo: `fabrica-ia-api`
- URL configurada: `https://fabrica-ia-api.onrender.com`
- Integração via plugin `src/plugins/fabricaPlugin.js`

### Variante Hostinger
- Entrada: `server_hostinger_entry.js` (encaminha para `server.js`)
- Existe também `server_HOSTINGER.js` legado/simplificado

## 2) Frontend (onde está e como é servido)

### Front no mesmo backend Node
- `express.static(__dirname)` em `server.js`
- Arquivos estáticos na raiz (ex.: `index.html`, `dashboard.html`, `index_HOSTINGER.html`)
- Dashboard: rota `/dashboard` (arquivo `dashboard.html`)

### Domínios front permitidos no CORS
- `https://ideiatoapp.me`
- `https://www.ideiatoapp.me`
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://qg-ia-nexus.onrender.com`

## 3) Bancos de dados em uso

### Banco principal
- Supabase (Postgres)
- Cliente: `@supabase/supabase-js`
- Chaves via `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
- Uso em memória persistente/aprovações/evolução etc.

### Banco secundário (opcional)
- MySQL (Hostinger)
- Ativa quando `DB_HOST`, `DB_USER`, `DB_NAME`, `DB_PASS` existem
- Uso: módulos de dados financeiros e tabelas auxiliares

## 4) Onde cada IA está colocada (backend)

Arquivo: `src/services/aiService.js`

### Provedores integrados
1. Gemini
- Método: `callGemini`
- Endpoint: Google Generative Language API
- Chave: `GEMINI_API_KEY`

2. DeepSeek
- Método: `callDeepSeek`
- Endpoint: `api.deepseek.com`
- Chave: `DEEPSEEK_API_KEY`

3. Cerebras
- Método: `callCerebras`
- Endpoint: `api.cerebras.ai`
- Chave: `CEREBRAS_API_KEY`

4. Anthropic
- Método: `callAnthropic`
- Endpoint: `api.anthropic.com`
- Chave: `ANTHROPIC_API_KEY`

5. OpenAI
- Método: `callOpenAI`
- Endpoint: `api.openai.com`
- Chave: `OPENAI_API_KEY`

6. Groq
- Método: `callGroq`
- Endpoint: `api.groq.com`
- Chave: `GROQ_API_KEY`

### Orquestração das IAs
- Entrada única: `chamarIAComCascata(...)`
- Seleção de provedores por domínio: `routingService` + `agentRouting.json`
- Guardrail de confiança baixa: usa ordem genérica e bloqueia especialização prematura

## 5) Alocação de IAs por domínio (roteamento)

Arquivo: `universal-engineering-implementation/agentRouting.json`

- software: Gemini, DeepSeek, Anthropic, Groq (fallback Cerebras/OpenAI)
- mechanical: DeepSeek, Gemini, Anthropic (fallback Groq/Cerebras/OpenAI)
- civil: Gemini, Anthropic, DeepSeek (fallback Groq/Cerebras/OpenAI)
- electrical: DeepSeek, Gemini, Anthropic (fallback Groq/Cerebras/OpenAI)
- chemical: DeepSeek, Anthropic, Gemini (fallback Groq/Cerebras/OpenAI)
- product: Gemini, Anthropic, DeepSeek (fallback Groq/Cerebras/OpenAI)
- integration: Anthropic, Gemini, DeepSeek (fallback Groq/Cerebras/OpenAI)

## 6) Mapa de risco por caminho de erro (resumo)

Relatórios gerados:
- `API_ERROR_SURFACE_REPORT.json`
- `ERROR_PATH_SCAN_REPORT.json`
- `FUZZ_PATH_REPORT.json`
- `CRITICAL_ERROR_PATHS.md`

Principais caminhos de erro:
- entrada vazia/vaga -> baixa confiança e necessidade de clarificação
- texto degradado extremo (ex.: remoção de vogais) -> alta taxa de erro
- truncamento e ruído de payload -> risco moderado
- dependência de vocabulário explícito para classificação por domínio

## 7) Conclusão operacional
- Backend e orquestração de IA estão centralizados no `server.js` + `src/services/aiService.js`.
- Front principal é estático servido pelo próprio backend (com alternativa Hostinger).
- Dados persistentes principais em Supabase; MySQL é complementar e condicional.
- Guardrails e quality gates estão ativos para reduzir regressão.
