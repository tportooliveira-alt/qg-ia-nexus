# 06 — Visão do QG IA Nexus v2

## O que será o novo app

Um **QG operacional profissional** — não apenas um chat com IA.
Uma plataforma onde projetos reais (fazenda, frigorífico, apps) são gerenciados,
gerados e evoluídos com ajuda de agentes especializados.

---

## Estrutura do monorepo (nova organização)

```
qg-ia-nexus/                         ← raiz do monorepo
├── package.json                      ← workspaces: ["apps/*", "packages/*"]
├── turbo.json                        ← Turborepo (cache de builds)
├── render.yaml                       ← deploy backend no Render
├── _CONSOLIDADO/                     ← esta pasta (documentação mestre)
│
├── apps/
│   ├── api/                          ← Express backend (migrado de /)
│   │   ├── server.js                 ← entry point ~50 linhas
│   │   └── src/
│   │       ├── routes/               ← 12 route files (era 1 server.js de 681 linhas)
│   │       │   ├── index.js
│   │       │   ├── nexus.routes.js
│   │       │   ├── agent.routes.js
│   │       │   ├── fabrica.routes.js
│   │       │   ├── knowledge.routes.js
│   │       │   ├── memory.routes.js
│   │       │   ├── approval.routes.js
│   │       │   ├── terminal.routes.js
│   │       │   ├── fs.routes.js
│   │       │   ├── skills.routes.js
│   │       │   ├── config.routes.js
│   │       │   ├── mcp.routes.js     ← NOVO
│   │       │   └── status.routes.js
│   │       ├── services/             ← 20 serviços existentes + 2 novos
│   │       │   ├── [20 serviços — MANTER SEM MODIFICAR]
│   │       │   ├── sessionService.js ← NOVO: SSE resumível
│   │       │   └── mcpService.js     ← NOVO: MCP client
│   │       ├── plugins/
│   │       ├── knowledge_base/
│   │       ├── skills/
│   │       ├── bootstrap.js          ← NOVO: inicialização extraída do server.js
│   │       └── utils/
│   │           └── safeAudit.js      ← NOVO: helper
│   │
│   └── web/                          ← NOVO: React/Vite frontend
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── src/
│           ├── styles/
│           │   ├── tokens.css        ← design system (CSS custom properties)
│           │   ├── global.css
│           │   └── animations.css
│           ├── store/                ← Zustand
│           │   ├── useChatStore.ts
│           │   ├── useAgentStore.ts
│           │   ├── useFabricaStore.ts
│           │   └── useUIStore.ts
│           ├── api/                  ← clientes HTTP tipados
│           │   ├── client.ts
│           │   ├── nexus.api.ts
│           │   ├── agents.api.ts
│           │   ├── fabrica.api.ts
│           │   └── sse.ts            ← SSE com reconnect + session ID
│           ├── components/
│           │   ├── ui/               ← Button, Badge, Card, Modal, Spinner
│           │   ├── layout/           ← AppShell, Sidebar, Header, MobileNav
│           │   ├── chat/             ← ChatPanel, MessageBubble, StreamingDots
│           │   │                        ProviderBadge, DomainBadge, CostIndicator
│           │   │                        ConversationBranch (NOVO)
│           │   ├── agents/           ← AgentGrid, AgentCard, AgentStatusBadge
│           │   ├── fabrica/          ← PipelineKanban (NOVO), FabricaPanel
│           │   ├── memory/           ← MemoryDashboard (NOVO)
│           │   └── mcp/              ← MCPPanel (NOVO)
│           └── pages/
│               ├── DashboardPage.tsx
│               ├── ChatPage.tsx
│               ├── AgentsPage.tsx
│               ├── FabricaPage.tsx
│               ├── KnowledgePage.tsx
│               ├── TerminalPage.tsx
│               ├── MemoryPage.tsx
│               ├── AuditPage.tsx
│               └── MCPPage.tsx
│
└── packages/
    └── shared/                       ← tipos TypeScript compartilhados
        └── src/types/                ← agent, chat, fabrica, api types
```

---

## Stack de tecnologia

| Camada | Escolha | Alternativa descartada | Por quê |
|--------|---------|----------------------|---------|
| Backend | Node.js/Express (manter) | — | Funciona em produção |
| Frontend | React 19 + Vite | Next.js | SPA autenticada — não precisa SSR |
| Linguagem frontend | TypeScript | JavaScript | Type safety nas chamadas API |
| Roteamento | React Router v6 | — | Lazy loading por página |
| State | Zustand | Redux | 10x menos código, mesma capacidade |
| Data fetching | TanStack Query | SWR | Cache + invalidação automática |
| Estilo | Tailwind CSS v4 + CSS vars | CSS Modules | Tokens como fonte de verdade |
| Monorepo | Turborepo | Nx | Mais simples para equipe pequena |

---

## Novas capacidades do v2

### 1. MCP Integration
```
Servidor MCP: brave-search
  → POST /api/mcp/invoke { server: "brave-search", tool: "search", args: { query } }
  → mcpService.invokeTool("brave-search", "search", { query })
  → retorna resultados estruturados

Servidor MCP: filesystem
  → acesso controlado a arquivos do projeto

Servidor MCP: github
  → lê issues, PRs, código do repositório
```

### 2. SSE Resumível
```
Cliente envia: { prompt, sessionId: "abc123" }
Backend: SessionService.createOrResume("abc123")
  → se sessão existe: retoma do partial acumulado
  → se nova: cria sessão nova
Durante stream: SessionService.update("abc123", chunk)
Ao fim: SessionService.complete("abc123")
```

### 3. PipelineKanban
```
[Analista] → [Comandante] → [Arquiteto + Designer] → [CoderChief] → [Auditor] → [Entrega]
  ✅ done      ✅ done       ⏳ running (2.3s)        ○ waiting     ○ waiting    ○ waiting

Score atual: --  |  Iteração: 1/4  |  Tempo total: 8.2s
```

### 4. Provider & Domain Badge
```
[Resposta do Nexus Claw]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Considerando os dados do rebanho...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤖 Gemini Pro  |  🌾 agro  |  ⚡ 1.2s  |  💰 $0.002
```

### 5. Conversation Branching
```
[Mensagem: "Como otimizar o rebanho?"]
  └── [Resposta 1: Nutrição]
  └── [Resposta 2: Genética]  ← fork aqui
       └── [Mensagem: "Aprofundar em raças"]
```

### 6. Memory Dashboard
```
Memórias do Nexus Claw:
┌─────────────────────────────────────────┐
│ [fazenda] AgroMacro tem 450 cabeças...  │ 2 dias
│ [código] Prefere TypeScript em React... │ 1 sem
│ [finanças] Custo operacional fazenda... │ 3 dias
│ [projeto] FrigoGest migra p/ Supabase  │ 5 dias
└─────────────────────────────────────────┘
  [+ Nova memória]  [🗑️ Limpar antigas]
```

---

## Navegação do app

```
Sidebar (sempre visível no desktop, hamburger no mobile)
├── 🏠 Dashboard     ← visão geral: status, métricas, atividade recente
├── 💬 Chat          ← chat principal com Nexus Claw + streaming
├── 🤖 Agentes       ← grid de agentes, invocar, ver status
├── 🏭 Fábrica       ← submeter ideia, ver PipelineKanban ao vivo
├── 📚 Conhecimento  ← browsear knowledge base por domínio
├── 💻 Terminal      ← terminal remoto com histórico
├── 🧠 Memória       ← ver/editar o que o Nexus lembra
├── 📋 Auditoria     ← log de todas as ações
└── 🔌 MCP           ← gerenciar servidores MCP conectados
```

---

## WhatsApp v2 (persistente no Render)

Problema atual: QR code some a cada deploy.
Solução: Upstash Redis (gratuito) para persistir a sessão do Baileys.

```js
// whatsappService.js modificado
const { useRedisAuthState } = require('@whiskeysockets/baileys');
const redis = require('@upstash/redis');

// Em vez de useMultiFileAuthState (salva em disco):
const { state, saveCreds } = await useRedisAuthState(redis.client);
```

Resultado: QR escaneia 1 vez. Nunca mais pede de novo.
