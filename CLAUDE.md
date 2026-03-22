# CLAUDE.md — Guia de Orientação para Agentes IA

Este arquivo é lido automaticamente pelo Claude Code e pelo Claude Agent SDK ao trabalhar neste repositório. Siga estas instruções antes de qualquer ação.

---

## O que é este projeto

**QG IA Nexus** — Quartel General de IA da Priscila (tportooliveira-alt).

É uma API Node.js/Express que funciona como o cérebro central de um sistema de IA pessoal. Tem:
- Chat com IA via WhatsApp (Baileys) e web
- Roteamento inteligente entre múltiplos provedores de IA (cascata)
- Sistema de memória persistente via Supabase
- Knowledge base carregada por contexto
- Plugin de Fábrica de IA (gera apps automaticamente)
- Agente autônomo via Claude Agent SDK
- Streaming SSE nas respostas

**Domínio de produção:** `https://qg-ia-nexus.onrender.com`
**Dono do repositório:** tportooliveira-alt
**Stack:** Node.js 18+, Express 4, Supabase, WhatsApp via Baileys

---

## Estrutura do projeto

```
/
├── server.js                    # Entry point — todas as rotas Express
├── src/
│   ├── services/
│   │   ├── nexusService.js      # Core: carrega contexto + processa comandos
│   │   ├── aiService.js         # Cascade de IAs (Gemini, DeepSeek, Anthropic, Groq, Cerebras, OpenAI)
│   │   ├── agentService.js      # Claude Agent SDK — agente autônomo
│   │   ├── routingService.js    # Roteamento inteligente por domínio
│   │   ├── memoryService.js     # Memória persistente (Supabase)
│   │   ├── whatsappService.js   # Integração WhatsApp (Baileys)
│   │   ├── terminalService.js   # Execução de comandos com auto-healing
│   │   ├── auditService.js      # Log de auditoria
│   │   └── authMiddleware.js    # Token auth + rate limiter
│   ├── knowledge_base/          # Arquivos MD carregados por contexto (com cache 5min)
│   │   ├── NEXUS_CORE_KNOWLEDGE.md
│   │   ├── NEXUS_MASTER_ROADMAP.md
│   │   ├── NEXUS_FINANCE_EXPERT.md
│   │   ├── NEXUS_TECH_RADAR.md
│   │   ├── NEXUS_AGENT_NETWORK.md
│   │   └── NEXUS_FABRICA_PLUGIN.md
│   ├── plugins/
│   │   ├── fabricaPlugin.js     # Fábrica de IA — gera apps via pipeline
│   │   └── pluginManager.js
│   └── skills/
│       ├── SkillHub.json
│       └── agentes/
│           └── VidaDigital.json # Perfil do usuário — sempre carregado
├── universal-engineering-implementation/
│   └── agentRouting.json        # Config de roteamento por domínio
└── fabrica-ia-api/              # Submodule — API da Fábrica de IA
```

---

## Rotas principais

| Método | Rota | O que faz |
|--------|------|-----------|
| POST | `/api/nexus/comando` | Chat com Nexus Claw (resposta completa) |
| POST | `/api/nexus/stream` | Chat com Nexus Claw via SSE (streaming token a token) |
| POST | `/api/nexus/agente` | Agente autônomo — resultado completo |
| POST | `/api/nexus/agente/stream` | Agente autônomo — SSE em tempo real |
| GET  | `/api/nexus/conhecimentos` | Lista conhecimentos aprendidos |
| POST | `/api/fabrica/submeter` | Submete ideia para Fábrica de IA |
| GET  | `/api/fabrica/status` | Status da Fábrica |

Todas as rotas `/api/*` exigem header `Authorization: Bearer <QG_AUTH_TOKEN>`.

---

## Variáveis de ambiente necessárias

```env
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
GROQ_API_KEY=
CEREBRAS_API_KEY=
OPENAI_API_KEY=        # opcional
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
QG_AUTH_TOKEN=         # token de autenticação das rotas
FABRICA_API_URL=       # URL da fabrica-ia-api
FABRICA_API_KEY=       # chave da fábrica
PORT=3000
TOKEN_VOLUME=normal    # eco | normal | power
DOMAIN_CONFIDENCE_THRESHOLD=0.25
```

---

## Como rodar localmente

```bash
npm install
cp .env.example .env   # preencha as chaves
npm start              # ou: npm run dev (com nodemon)
```

---

## Cascade de IAs

O `aiService.js` tenta os provedores em ordem de prioridade. Se um falha (quota, timeout, erro), passa pro próximo automaticamente.

Ordem padrão: `Gemini → DeepSeek → Anthropic → Groq → Cerebras → OpenAI`

O `routingService.js` ajusta a ordem por domínio (código, análise, rapidez) usando `agentRouting.json`.

---

## Cache da knowledge base

O `nexusService.js` usa cache em memória com TTL de 5 minutos para os arquivos da `knowledge_base/`. Todos os arquivos são carregados em paralelo via `Promise.all`.

Para forçar reload imediato do cache: reinicie o servidor ou aguarde 5 minutos.

---

## Projetos em desenvolvimento (contexto importante)

- **AgroMacro** — PWA com 27 módulos para gestão de fazenda (rebanho, pasto, financeiro, IA consultora)
- **Fazenda Cérebro** — React Native, agentes paralelos, voz + foto + texto
- **FrigoGest** — React + Supabase, 16 agentes IA em 5 tiers para frigorífico
- **Fábrica de IA** — pipeline automatizado: Analista → Comandante → Arquiteto → Coder → Auditor

---

## Regras para agentes trabalhando neste repositório

1. **Nunca commitar `.env`** — contém chaves de API
2. **Nunca modificar `fabrica-ia-api/`** — é submodule separado
3. **Sempre rodar `npm audit` antes de fazer push** — manter zero vulnerabilidades
4. **Testes ficam em `tests/`** — rodar com `npm test` antes de PR
5. **Responder sempre em português do Brasil** — este projeto é 100% PT-BR
6. **Ao adicionar novo provedor de IA**, seguir o padrão do `aiService.js` (método `callProvedor`)
7. **Ao adicionar nova rota**, seguir o padrão: `autenticarToken + rateLimiter(n)` obrigatórios
8. **Knowledge base** — arquivos em `src/knowledge_base/` são carregados com cache; editar lá para mudar contexto do Nexus Claw

---

## Comandos úteis

```bash
npm test                    # testes gerais
npm run war-room            # loop de testes contínuos
npm run quality:gate        # verificação de qualidade
npm run benchmark:domain    # benchmark de roteamento por domínio
npm audit                   # verificar vulnerabilidades
git submodule update --init # atualizar fabrica-ia-api
```
