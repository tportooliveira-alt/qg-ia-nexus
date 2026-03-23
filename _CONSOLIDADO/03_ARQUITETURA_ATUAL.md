# 03 — Arquitetura Atual (como o código funciona hoje)

## Fluxo de uma requisição (do início ao fim)

```
[Usuário] → WhatsApp / Dashboard / API
     ↓
server.js (Express, 36 rotas)
     ↓
authMiddleware.js → valida token + rate limit
     ↓
nexusService.js → carregarContextoOtimizado(prompt)
     ↓ Promise.all paralelo
  ┌──────────────────────────────────────────────┐
  │ NEXUS_CORE_KNOWLEDGE.md  (sempre)            │
  │ NEXUS_MASTER_ROADMAP.md  (sempre)            │
  │ VidaDigital.json         (sempre)            │
  │ NEXUS_FINANCE_EXPERT.md  (se financi/cfo)    │
  │ NEXUS_TECH_RADAR.md      (se tend/radar)     │
  │ NEXUS_AGENT_NETWORK.md   (se rede/agente)    │
  │ NEXUS_FABRICA_PLUGIN.md  (se criar app)      │
  │ SkillHub.json            (se skill/contratar)│
  │ MemoryService.listar()   (últimas 15 memórias)│
  └──────────────────────────────────────────────┘
     ↓
routingService.js → detecta domínio + ordena provedores
     ↓
aiService.chamarIAComCascata()
     ↓ tenta em ordem até um funcionar
  Gemini → DeepSeek → Anthropic → Groq → Cerebras → OpenAI
     ↓
[resposta] → verifica CMD: → terminalService (auto-healing)
     ↓
auditService.registrar() [background]
     ↓
[Usuário recebe resposta]
```

---

## 36 Rotas (mapa completo do server.js)

### Autenticação & Status
```
GET  /api/auth/verify           → valida token
GET  /api/status                → telemetria + uptime
```

### Nexus Core (chat)
```
POST /api/nexus/comando         → resposta completa
POST /api/nexus/stream          → SSE token a token
POST /api/nexus/agente          → Claude Agent SDK (completo)
POST /api/nexus/agente/stream   → Claude Agent SDK (SSE)
POST /api/nexus/pesquisa        → ciclo de pesquisa autônomo
GET  /api/nexus/conhecimentos   → lista fatos aprendidos
```

### Agentes
```
POST /api/agentes/executar      → executa agente por domínio
GET  /api/agentes               → lista todos os agentes
POST /api/agent/memory          → registra memória
GET  /api/agent/memory          → consulta memórias
```

### Fábrica de IA (proxy para fabrica-ia-api)
```
POST /api/fabrica/toggle               → liga/desliga
GET  /api/fabrica/toggle               → estado atual
GET  /api/fabrica/status               → saúde da fábrica
POST /api/fabrica/orquestrar           → submete ideia
GET  /api/fabrica/pipeline/:id/status  → estado do pipeline
GET  /api/fabrica/pipeline/:id/stream  → SSE do pipeline
POST /api/fabrica/pipeline/:id/cancelar
GET  /api/fabrica/projetos             → lista projetos
GET  /api/fabrica/projetos/:id         → projeto específico
```

### Conhecimento & Domínios
```
POST /api/domain-detect         → detecta domínio de engenharia
GET  /api/knowledge             → lista domínios
GET  /api/knowledge/:domain     → consulta KB por domínio
```

### Aprovações (human-in-the-loop)
```
POST /api/approvals/request     → pede aprovação
GET  /api/approvals/pending     → lista pendências
POST /api/approvals/decide      → aprova ou rejeita
```

### Terminal & Sistema de Arquivos
```
POST /api/terminal/exec         → executa comando (com segurança)
GET  /api/fs/ler                → lê arquivo
POST /api/fs/escrever           → escreve arquivo (com snapshot)
```

### Skills & Config
```
POST /api/skills/factory        → cria skill dinamicamente
POST /api/config/token-volume   → ajusta eco/normal/power
GET  /config.js                 → config para frontend (localhost only)
```

---

## 20 Serviços — responsabilidades

| Serviço | Responsabilidade | Dependências |
|---------|-----------------|-------------|
| `aiService.js` | Cascade de 6 provedores, streaming | node-fetch |
| `nexusService.js` | Orquestração central, cache KB | aiService, memoryService |
| `routingService.js` | Roteamento por domínio | domainDetectorService, agentRouting.json |
| `agentService.js` | Claude Agent SDK | @anthropic-ai/claude-agent-sdk |
| `domainDetectorService.js` | Classifica domínio com confiança | — |
| `domainBenchmarkService.js` | Métricas de performance por domínio | — |
| `memoryService.js` | CRUD de memórias | Supabase |
| `knowledgeService.js` | Loader KB com cache e busca | fs, path |
| `authMiddleware.js` | Token auth + rate limiter | — |
| `auditService.js` | Log de ações | fs |
| `approvalService.js` | Workflow de aprovação humana | — |
| `agentRegistryService.js` | Registro e catálogo de agentes | skills/*.json |
| `evolutionService.js` | Acumula fatos aprendidos | Supabase |
| `researchService.js` | Pesquisa autônoma (cron 6h) | aiService |
| `terminalService.js` | Executa comandos com auto-healing | child_process |
| `whatsappService.js` | Bot WhatsApp via Baileys | @whiskeysockets/baileys |
| `backupService.js` | Snapshots e recuperação | fs |
| `financialService.js` | DRE + fluxo de caixa | mysqlService |
| `mysqlService.js` | Conector MySQL (Hostinger) | mysql2 |
| `requestValidationService.js` | Sanitização de input | — |

---

## Plugins

### fabricaPlugin.js
- Cliente HTTP que se comunica com `fabrica-ia-api.onrender.com`
- Métodos: `submeterIdeia()`, `getStatus()`, `streamPipeline()`
- Gerenciado pelo `pluginManager.js` (pode ligar/desligar em runtime)

### pluginManager.js
- Registro central de plugins
- `get('fabricaIA')` retorna instância do plugin
- Suporta múltiplos plugins futuros

---

## Cascade de IAs — lógica de roteamento

```
Prompt recebido
    ↓
RoutingService.getRoutingForTask()
    ↓
DomainDetectorService.detectDomain(prompt)
    ↓ retorna: { domain, confidence, allProviders }

Se confidence < 0.25 (threshold):
    → usa ordem padrão: Gemini→DeepSeek→Anthropic→Groq→Cerebras→OpenAI

Se confidence >= 0.25:
    software   → DeepSeek, Gemini, Anthropic, Groq
    analysis   → Anthropic, Gemini, DeepSeek, Groq
    rapid      → Groq, Cerebras, Gemini
    default    → Gemini, DeepSeek, Anthropic, Groq, Cerebras, OpenAI

Para cada provedor na lista:
    → tenta chamar API
    → se 429/quota: próximo
    → se erro: próximo
    → se sucesso: retorna { resultado, iaUsada }

Se todos falharem:
    → throw Error("Todas as IAs falharam")
```

---

## Cache da Knowledge Base

```js
// nexusService.js
const _kbCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function readCached(filePath, fallback = "") {
  const now = Date.now();
  const hit = _kbCache.get(filePath);
  if (hit && (now - hit.ts) < CACHE_TTL) return hit.content;
  const content = await fs.readFile(filePath, "utf-8").catch(() => fallback);
  _kbCache.set(filePath, { content, ts: now });
  return content;
}
// Todos os arquivos carregados em paralelo via Promise.all
```

---

## Problemas de arquitetura conhecidos

| Problema | Onde | Impacto |
|----------|------|---------|
| `server.js` com 681 linhas | server.js | Impossível navegar ou manter |
| Lógica de inicialização no fim do server.js | server.js L600+ | Confunde entry point com bootstrap |
| Rate limiter em `Map` em memória | authMiddleware.js | Não funciona em multi-instância |
| CORS hardcoded como array | server.js | Precisa de código para mudar |
| `GET /config.js` expõe chaves no browser | server.js | Risco de segurança |
| WhatsApp usa `useMultiFileAuthState` | whatsappService.js | QR some a cada deploy no Render |
| Sem testes de integração reais | tests/ | Cobertura baixa |
| `explorer.js`, `vidente.js` soltos na raiz | / | Não integrados ao sistema |
