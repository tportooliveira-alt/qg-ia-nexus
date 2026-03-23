# 01 — Estado Atual do Ecossistema (2026-03-22)

## Resumo executivo

Você tem o motor de um carro de corrida montado dentro de uma garagem bagunçada.
O motor funciona. O problema é a organização, o design e as peças espalhadas.

---

## Projetos em produção (funcionando agora)

| Projeto | URL | Stack | Status |
|---------|-----|-------|--------|
| **QG IA Nexus** (hub) | qg-ia-nexus.onrender.com | Node.js/Express + Supabase | ✅ Online |
| **Fábrica de IA** (pipeline) | fabrica-ia-api.onrender.com | Node.js + Supabase/SQLite | ✅ Online |
| **FrigoGest** | — | React/TS + Firebase | ✅ v2.7.0 |
| **ideiatoapp.me** | ideiatoapp.me | Frontend da Fábrica | ✅ Online |

## Projetos funcionais (sem deploy)

| Projeto | Stack | Status |
|---------|-------|--------|
| **AgroMacro** | PWA Vanilla JS, 27+ módulos, offline-first | 🟡 Funcional, sem deploy |
| **IdeaOrganizer** | Embutido no dashboard | 🟡 Funcional |

## Projetos incompletos

| Projeto | Stack | Status |
|---------|-------|--------|
| **GESTAO-ANTARES** | React/TS | 🔴 v0.0.0, incompleto |

## Duplicatas a deletar

| O que é | Onde está | Ação |
|---------|-----------|------|
| QG-IA-NOVO | Desktop/ | Deletar — cópia de 3 dias atrás |
| fabrica v2.0.0 | tmp-repos/ | Deletar — versão antiga |
| TUDO_PARA_BACKUP/ | Desktop? | Deletar após verificar |

---

## O que funciona bem (não mexer)

### Backend — 20 serviços operacionais

| Serviço | O que faz | Estado |
|---------|-----------|--------|
| `aiService.js` | Cascade: Gemini→DeepSeek→Anthropic→Groq→Cerebras→OpenAI | ✅ |
| `nexusService.js` | Cache KB 5min + carregamento paralelo + processamento central | ✅ |
| `routingService.js` | Roteamento inteligente por domínio de engenharia | ✅ |
| `agentService.js` | Claude Agent SDK — agente autônomo | ✅ |
| `domainDetectorService.js` | Classifica tarefa em domínio (software/civil/agro...) | ✅ |
| `memoryService.js` | Memória persistente via Supabase | ✅ |
| `knowledgeService.js` | Loader da knowledge base com cache | ✅ |
| `authMiddleware.js` | Token auth + rate limiter | ✅ |
| `auditService.js` | Log de auditoria | ✅ |
| `approvalService.js` | Aprovação humana de ações críticas | ✅ |
| `agentRegistryService.js` | Registro central de agentes | ✅ |
| `evolutionService.js` | Aprendizado e auto-evolução | ✅ |
| `researchService.js` | Pesquisa autônoma (cron a cada 6h) | ✅ |
| `terminalService.js` | Execução de comandos com auto-healing | ✅ |
| `whatsappService.js` | WhatsApp via Baileys | ✅ local / ⚠️ Render |
| `backupService.js` | Snapshots e recuperação | ✅ |
| `financialService.js` | DRE e fluxo de caixa (MySQL) | ✅ |
| `mysqlService.js` | Conector MySQL (Hostinger) | ✅ |
| `requestValidationService.js` | Sanitização e validação de input | ✅ |
| `fabricaPlugin.js` | Cliente da Fábrica de IA | ✅ |

### Knowledge Base — 6 bases + 7 domínios de engenharia

| Arquivo | Conteúdo |
|---------|----------|
| `NEXUS_CORE_KNOWLEDGE.md` | Identidade e princípios do Nexus Claw |
| `NEXUS_MASTER_ROADMAP.md` | 4 fases de evolução (fundação → singularidade) |
| `NEXUS_FINANCE_EXPERT.md` | CFO: fluxo de caixa, métricas SaaS, FinOps |
| `NEXUS_TECH_RADAR.md` | Caça de tendências (HuggingFace, ArXiv, YC) |
| `NEXUS_AGENT_NETWORK.md` | Diplomacia entre agentes, protocolos |
| `NEXUS_FABRICA_PLUGIN.md` | Pipeline da Fábrica, triggers, rotas |
| `software/`, `mechanical/`, `civil/`, `electrical/`, `chemical/`, `product/`, `integration/` | 7 disciplinas completas |

### Agentes — 15 perfis JSON

`NexusClaw`, `VidaDigital`, `Analista`, `Arquiteto`, `Scout`, `GeminiCode`, `OpenClawBR`, `ProductDesigner`, `SoftwareEngineer`, `SystemsIntegrator`, `DomainDetector`, `ChemicalEngineer`, `CivilArchitect`, `ElectricalEngineer`, `MechanicalEngineer`

---

## O que está quebrado ou faltando

### Problemas técnicos

| Problema | Impacto | Solução planejada |
|----------|---------|------------------|
| `server.js` com 681 linhas e 36 rotas | Impossível de manter | Fase 1: dividir em 12 route files |
| `dashboard.html` com 56KB inline | Impossível de evoluir | Fase 2: React/Vite |
| WhatsApp perde sessão a cada deploy no Render | Bot cai em produção | Redis (Upstash) + useRedisAuthState |
| Rate limiter em memória | Não funciona em multi-instância | Migrar para Redis (fase futura) |
| CORS hardcoded | Risco ao mudar frontend | Var de ambiente `ALLOWED_ORIGINS` |
| `/config.js` expõe chaves | Risco de segurança | Remover na Fase 2 |

### Capacidades que faltam (concorrentes já têm)

| Capacidade | Quem tem | Prioridade |
|-----------|---------|------------|
| MCP — 10.000+ ferramentas externas | LobeHub | Alta |
| SSE resumível (reconexão sem perder dados) | LibreChat | Alta |
| Branching de conversa (fork) | LibreChat | Média |
| Visualização de memória | LobeHub | Média |
| Custo por resposta (tokens/USD) | LibreChat | Média |
| Sandbox de execução de código | LibreChat | Baixa |
| Sync multi-dispositivo | LobeHub | Baixa |

---

## Variáveis de ambiente (inventário completo)

```env
# IA Providers (todas necessárias)
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
GROQ_API_KEY=
CEREBRAS_API_KEY=
OPENAI_API_KEY=          # opcional, fallback final

# Banco de dados
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Autenticação
QG_AUTH_TOKEN=

# Fábrica de IA
FABRICA_API_URL=https://fabrica-ia-api.onrender.com
FABRICA_API_KEY=

# MySQL (Hostinger — financeiro)
MYSQL_HOST=
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=

# Configuração
PORT=3000
TOKEN_VOLUME=normal       # eco | normal | power
DOMAIN_CONFIDENCE_THRESHOLD=0.25
ENABLE_WHATSAPP=false     # true apenas local

# A ADICIONAR (Fase 3)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
MCP_BRAVE_SEARCH_KEY=
ALLOWED_ORIGINS=
```
