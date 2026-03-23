# 04 — Fragmentos Encontrados (inventário completo do PC)

> Tudo que estava espalhado, mapeado em um lugar.

---

## Fragmentos DENTRO do qg-ia-nexus (raiz bagunçada)

### Arquivos JS soltos (não integrados ao servidor principal)

| Arquivo | O que é | Estado | Destino certo |
|---------|---------|--------|--------------|
| `auto_evolve.js` | Runner manual do ResearchService | Útil como script | `scripts/auto_evolve.js` |
| `explorer.js` | Agente Explorador Técnico — busca IAs/MCPs na web | Funcional, isolado | Integrar como skill `src/skills/agentes/Explorer.json` + rota |
| `governance.js` | JS do frontend de aprovações (governança) | Parte do dashboard.html | Reescrever como componente React |
| `vidente.js` | Agente Vidente — analisa sistema de 2 ângulos | Funcional, isolado | Integrar como skill `src/skills/agentes/Vidente.json` |
| `skills_data.js` | Pack de skills para import no browser | Dados estáticos | `src/skills/skills_data.js` |
| `ui_settings.js` | JS de configurações do dashboard | Parte do dashboard.html | Reescrever como componente React |
| `list_gemini_models.js` | Script utilitário | Uso único | `scripts/list_gemini_models.js` |
| `server_HOSTINGER.js` | Server antigo para Hostinger | Obsoleto | Deletar |
| `server_hostinger_entry.js` | Entry point antigo Hostinger | Obsoleto | Deletar |
| `index_HOSTINGER.html` | Frontend antigo Hostinger | Obsoleto | Deletar |
| `supabase_tabelas_faltando.sql` | Migrations Supabase | Útil | `database/migrations/001_tabelas.sql` |

### Documentos de planejamento (11 no total — todos consolidados aqui)

| Arquivo | O que tinha | Status |
|---------|-------------|--------|
| `MASTER_PLAN.md` | Mapa do ecossistema + 6 fases + 3 problemas urgentes | ✅ Absorvido |
| `INTEGRATION_PLAN.md` | Integração Nexus + Fábrica, 12 semanas | ✅ Absorvido |
| `IMPROVEMENTS_FUTURE.md` | Visão 2030, microservices, vector DB | ✅ Absorvido |
| `PLANO-DE-IMPLEMENTACAO.md` | 4 fases: MySQL cloud, WhatsApp cloud, mobile dashboard | ✅ Absorvido |
| `ANALYSIS_DEEP.md` | Análise técnica profunda (pontos fortes e fracos) | ✅ Absorvido |
| `PLANO_CIRURGIA_PC.md` | Cirurgia do PC — segurança, duplicatas, GitHub | ✅ Absorvido |
| `NEXUS_OPERATIONS_MANUAL.md` | Manual operacional do Nexus | ✅ Absorvido |
| `RESTART_GUIDE.md` | Guia de reinício do servidor | ✅ Absorvido |
| `PROMPTS_ANTIGRAVITY_MCP.md` | Prompts para integração MCP | ✅ Absorvido |
| `UNIVERSAL_ENGINEERING_EXPANSION.md` | Expansão para engenharia multi-domínio | ✅ Absorvido |
| `CLAUDE.md` | Guia para agentes IA (manter atualizado) | ✅ Ativo |

### Arquivos na `universal-engineering-implementation/`

| Arquivo | O que é |
|---------|---------|
| `agentRouting.json` | Config de roteamento por domínio (NÃO TOCAR) |
| `ANALISE_QG_IA_NEXUS.md` | Análise executiva de qualidade |
| `CRITICAL_ERROR_PATHS.md` | Mapa de caminhos de erro |
| `EXACT_INFRA_IA_MAP.md` | Diagrama de infraestrutura |
| `IMPLEMENTATION_PLAN.md` | Plano de implementação do roteamento universal |
| `IMPLEMENTATION_REGISTRY_FULL_AUDIT.md` | Auditoria completa |
| `NEXT_SESSION_AGENDA.md` | Agenda da próxima sessão (obsoleto agora) |
| `STUDY_AGENT_WEB_SAFETY_GUIDE.md` | Guia de segurança para agentes web |
| `FUZZ_PATH_REPORT.json` | Resultados de testes fuzzing |
| `QUALITY_GATE_TREND_REPORT.json` | Métricas de qualidade ao longo do tempo |
| `WAR_ROOM_LOOP_REPORT.json` | Resultados de testes contínuos |

---

## Fragmentos FORA do qg-ia-nexus

### `C:\Users\Priscila\fabrica-ia-api\` (projeto separado)

```
fabrica-ia-api/
├── server/
│   ├── server.js              ← entry point
│   ├── core/
│   │   ├── MasterOrchestrator.js  ← cérebro do pipeline
│   │   ├── PipelineManager.js     ← ciclo de vida dos pipelines
│   │   ├── AgentMemory.js         ← aprendizado entre pipelines
│   │   └── SubAgentSpawner.js     ← spawna sub-agentes
│   └── agents/
│       ├── analyst.js, commander.js, architect.js
│       ├── designer.js, CoderChief.js, coder.js
│       ├── auditor.js, fixer.js
│       ├── FrontendAgent.js, BackendAgent.js, SqlAgent.js
│       ├── DocumentoAgent.js, PlanilhaAgent.js
│       ├── ApresentacaoAgent.js, SecurityAgent.js
├── fabrica.html               ← frontend da fábrica
├── index.html                 ← landing
├── render.yaml                ← deploy config
└── skills_data.js             ← pack de skills
```

**Pipeline v4:**
```
Analista (Groq-rápido) → Comandante (Anthropic) → [Arquiteto + Designer] paralelo
→ CoderChief → [Frontend + Backend + SQL + outros] paralelo
→ Auditor (Claude) score >= 75 → Entrega
→ se score < 75: Fixer (DeepSeek) → loop (máx 4x)
```

### `C:\Users\Priscila\frigogest-2026\` — SEM GITHUB

```
frigogest-2026/
├── App.tsx                    ← entrada React
├── ai/                        ← 16 agentes IA
├── README.md
├── DEEP_ANALYSIS_AUDIT.md
├── PADRAO_ESTORNO_BLINDADO.md ← lógica de estorno
├── PLANO_MIGRACAO_SUPABASE.md ← migrando Firebase → Supabase
└── [build logs, análises financeiras]
```

**Stack:** React/TypeScript + Firebase
**Versão:** v2.7.0
**Funcionalidade:** Gestão de frigorífico — 16 agentes em 5 tiers
**URGENTE:** Criar repositório GitHub agora

### `C:\Users\Priscila\tmp-repos\AgroMacro\` — sem deploy

```
AgroMacro/
├── index.html                 ← PWA entry
├── app.js                     ← lógica principal
├── manifest.json              ← PWA config
├── sw.js                      ← Service Worker (offline)
├── styles.css
├── assets/                    ← ícones, imagens
├── js/                        ← módulos JavaScript
├── docs/                      ← documentação
└── firebase.json              ← config Firebase (legado?)
```

**Stack:** PWA Vanilla JS — funciona 100% offline
**Módulos:** 27+ (rebanho, lotes, pastos, financeiro, rastreabilidade, IA consultora, KPIs)
**Diferencial:** Funciona sem internet (campo, fazenda)

### `C:\Users\Priscila\tmp-repos\GESTAO-DA-FAZENDA-ANTARES\` — incompleto

```
GESTAO-DA-FAZENDA-ANTARES/
├── App.tsx, index.tsx
├── components/
├── services/
├── types.ts
├── vite.config.ts
└── package.json
```

**Stack:** React/TypeScript + Vite
**Estado:** v0.0.0 — apenas estrutura inicial
**Decisão:** Verificar se absorve no AgroMacro ou evolui separado

### `C:\Users\Priscila\IdeaOrganizer\` — sem GitHub

```
IdeaOrganizer/
└── server/                    ← Node.js backend
```

**O que é:** Organizador de ideias — embutido no dashboard do Nexus
**Decisão:** Manter embutido no QG v2

### `C:\Users\Priscila\tmp-repos\fabrica-ia-api\` — DUPLICATA

- **Versão:** 2.0.0 (antiga)
- **Versão real:** `C:\Users\Priscila\fabrica-ia-api\` (v3.0.0)
- **Ação:** Deletar após confirmar que v3.0.0 está no GitHub

---

## Fragmentos de conhecimento na knowledge_base

### KBs de ideias capturadas (em `src/knowledge_base/`)

| Arquivo | O que é |
|---------|---------|
| `ideia-capturada.md` | Template/script master para capturar ideias de projetos |
| `app-via-f-brica.md` | PRD: Plataforma de Analytics com visão de consolidação |
| `super-app-fazenda-gest-o-pecu-ria-c-perfis-e-offline.md` | PRD: Super-app fazenda com RBAC + offline-first |

### KBs de disciplinas de engenharia

| Pasta | Arquivo | Conteúdo |
|-------|---------|----------|
| `software/` | `patterns_and_practices.md` | Microservices, design patterns, segurança |
| `mechanical/` | `engineering_fundamentals.md` | Mecânica, termodinâmica, manufatura |
| `civil/` | `design_and_compliance.md` | Estruturas, fundações, conformidade |
| `electrical/` | `power_and_controls.md` | Sistemas de energia, controles, IoT |
| `chemical/` | `process_and_safety.md` | Processos, reações, segurança industrial |
| `product/` | `ux_strategy_and_validation.md` | UX/UI, ergonomia, prototipagem |
| `integration/` | `orchestration_and_governance.md` | Integração multi-domínio |

---

## Resumo: o que temos vs. o que precisamos

| Temos | Precisamos |
|-------|-----------|
| ✅ 20 serviços funcionais | Organizados em monorepo |
| ✅ 36 rotas de API | Divididas em 12 route files |
| ✅ 15 agentes JSON | `vidente.js` e `explorer.js` integrados |
| ✅ 7 KBs de engenharia | Mantidas como estão |
| ✅ Fábrica de IA com 11 agentes | Conectada via MCP (futuro) |
| ✅ FrigoGest v2.7.0 | **No GitHub URGENTE** |
| ✅ AgroMacro 27 módulos | Deploy + conexão com hub |
| ❌ Frontend profissional | React/Vite a construir |
| ❌ MCP integration | mcpService.js a criar |
| ❌ Branching de conversa | ConversationBranch.tsx a criar |
| ❌ Visualização de memória | MemoryDashboard.tsx a criar |
