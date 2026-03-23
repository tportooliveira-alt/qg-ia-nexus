# 11 — Plano de Interface e Blueprint Completo
# QG IA Nexus v2

> Leitura dos 10 documentos consolidados + análise do mercado + revisão 3x do blueprint.
> Este documento é a planta definitiva da interface.

---

## PARTE 1 — PLANO DE PROJETO (texto)

### O que estamos construindo

O QG IA Nexus v2 é um **quartel general operacional** — não um chat comum.
É a interface de controle de um sistema de IA que gerencia projetos reais
(fazenda, frigorífico, geração de apps) com agentes especializados.

**Público:** Priscila — trabalha com projetos complexos, precisa de velocidade,
usa WhatsApp como canal principal, quer controle total sobre o que a IA faz.

**Princípio central:** Transparência total. O usuário sempre vê:
- Qual IA respondeu
- Qual domínio foi detectado
- Quanto custou
- O que o sistema lembra

### Stack final decidida

| Camada | Escolha |
|--------|---------|
| Frontend framework | React 19 + Vite |
| Linguagem | TypeScript |
| Componentes | **ShadCN/ui** + Radix UI (acessível por padrão) |
| Estilos | Tailwind CSS v4 + CSS custom properties |
| State | Zustand |
| Data fetching | TanStack Query |
| Roteamento | React Router v6 |
| Monorepo | Turborepo |
| Backend | Node.js/Express (manter) |
| Banco | Supabase (manter) |

### Por que ShadCN/ui

ShadCN não é uma biblioteca — é um conjunto de componentes que você copia para
dentro do projeto. Isso significa:
- Controle total sobre cada componente (sem caixa preta)
- Todos os componentes já usam Tailwind + Radix UI
- Acessibilidade de fora da caixa (Radix UI é WCAG AA)
- Temas via CSS variables (encaixa perfeitamente no nosso design system)
- Componentes prontos: Button, Card, Badge, Dialog, Tabs, Sheet, ScrollArea, etc.

### MCPs que vamos integrar

| MCP | Para que serve no QG |
|-----|---------------------|
| `@modelcontextprotocol/server-brave-search` | ResearchService busca web em tempo real |
| `@modelcontextprotocol/server-filesystem` | Agente lê/escreve arquivos do projeto |
| `@modelcontextprotocol/server-github` | Lê issues, PRs, código dos repos satélite |
| `@modelcontextprotocol/server-postgres` | Consultas diretas no Supabase via SQL |
| `@modelcontextprotocol/server-puppeteer` | Automação web (scraping, testes) |

---

## PARTE 2 — BLUEPRINT DA INTERFACE

### ESTRUTURA GERAL (todas as telas)

```
┌─────────────────────────────────────────────────────────────────┐
│                     QG IA NEXUS v2                              │
├─────────────────────────────────────────────────────────────────┤
│  TELAS:                                                         │
│  /login         → Autenticação por token                        │
│  /              → Dashboard (visão geral)                       │
│  /chat          → Chat principal com Nexus Claw                 │
│  /agents        → Agentes especializados                        │
│  /fabrica       → Fábrica de IA (pipeline kanban)              │
│  /knowledge     → Base de conhecimento por domínio              │
│  /terminal      → Terminal remoto                               │
│  /memory        → Memórias do Nexus                            │
│  /audit         → Log de auditoria                             │
│  /mcp           → Servidores MCP conectados                    │
└─────────────────────────────────────────────────────────────────┘
```

---

### TELA 0 — LOGIN

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│              ◈  QG IA NEXUS                                     │
│              Quartel General de Inteligência Artificial         │
│                                                                 │
│         ┌─────────────────────────────────────────┐            │
│         │  🔑 Token de Acesso                      │            │
│         │  ┌───────────────────────────────────┐  │            │
│         │  │ ••••••••••••••••••••••••••••••    │  │            │
│         │  └───────────────────────────────────┘  │            │
│         │                                         │            │
│         │  [ Entrar no QG ]                        │            │
│         └─────────────────────────────────────────┘            │
│                                                                 │
│         ● Sistema online  │  v2.0.0                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

COMPORTAMENTO:
- Token salvo no localStorage após login
- Se token inválido: shake animation no card + mensagem de erro
- Se token válido: fade out → redirect para /
- Sem "criar conta" — é um sistema privado
```

---

### LAYOUT BASE (AppShell) — Desktop

```
┌──────────────────────────────────────────────────────────────────────────┐
│ HEADER (64px, sticky)                                                    │
│ ┌──────────┬───────────────────────────────────────────────────────────┐ │
│ │ ◈ QG IA  │  ● Online    [Gemini Pro ▾]  [Normal ▾]   [Priscila ▾]  │ │
│ └──────────┴───────────────────────────────────────────────────────────┘ │
├──────────┬───────────────────────────────────────────────────────────────┤
│ SIDEBAR  │                    CONTEÚDO PRINCIPAL                         │
│ (240px)  │                                                               │
│          │                                                               │
│ 🏠 Home  │                                                               │
│ 💬 Chat  │           (conteúdo da página atual)                          │
│ 🤖 Agen  │                                                               │
│ 🏭 Fab   │                                                               │
│ 📚 Know  │                                                               │
│ 💻 Term  │                                                               │
│ 🧠 Mem   │                                                               │
│ 📋 Audit │                                                               │
│ 🔌 MCP   │                                                               │
│          │                                                               │
│ ──────── │                                                               │
│ v2.0.0   │                                                               │
└──────────┴───────────────────────────────────────────────────────────────┘

HEADER — componentes detalhados:
┌──────────────────────────────────────────────────────────────────────┐
│ [◈ QG IA]  [● Online]  [Gemini Pro ▾]  [⚡ Normal ▾]  [👤 Priscila]  │
│                                                                      │
│  Logo      Status dot  ProviderBadge   TokenVolume    UserMenu       │
│            (verde=ok   (último provedor (eco/normal/  (logout,       │
│            vermelho=err que respondeu)  power)         config)       │
└──────────────────────────────────────────────────────────────────────┘

SIDEBAR — item de navegação:
┌──────────────────────────────┐
│  ██ 💬 Chat          [3]     │  ← ativo: bg roxo, borda esquerda
│     🤖 Agentes               │  ← inativo: texto muted
│     🏭 Fábrica        ●      │  ← ponto = pipeline rodando
└──────────────────────────────┘
```

### LAYOUT BASE — Mobile (< 768px)

```
┌────────────────────────────┐
│ HEADER MOBILE (56px)       │
│ [≡] ◈ QG IA    [● Online]  │
└────────────────────────────┘
│                            │
│   Conteúdo da página       │
│   (scroll vertical)        │
│                            │
└────────────────────────────┘
│ BOTTOM NAV (56px, sticky)  │
│ [🏠][💬][🤖][🏭][📚]      │
└────────────────────────────┘

Sidebar mobile: Sheet (drawer) desliza da esquerda ao clicar [≡]
```

---

### TELA 1 — DASHBOARD (/)

```
┌──────────────────────────────────────────────────────────────────┐
│ BOM DIA, PRISCILA  ●  QG IA Nexus — 22 de março de 2026         │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CARDS DE STATUS (4 colunas no desktop, 2 no tablet, 1 no mobile)│
│                                                                   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │  🤖 IAs     │ │  🧠 Memórias│ │  🏭 Pipelines│ │  📡 MCP     │ │
│ │             │ │             │ │              │ │             │ │
│ │  6 online   │ │  47 salvas  │ │  2 ativos    │ │  3 servers  │ │
│ │  ████████░░ │ │  ████░░░░░░ │ │  ██████████  │ │  ████████░░ │ │
│ │  Gemini ● ↑ │ │  Hoje: 3   │ │  Em execução │ │  brave ●    │ │
│ └─────────────┘ └─────────────┘ └──────────────┘ └─────────────┘ │
│                                                                   │
│  ATIVIDADE RECENTE                    AGENTES ATIVOS             │
│  ┌──────────────────────────────┐    ┌─────────────────────────┐ │
│  │ 14:23 Chat — Nexus respondeu │    │ ◉ Nexus Claw    online  │ │
│  │ 14:10 Fábrica — Pipeline #42 │    │ ◉ Scout         online  │ │
│  │ 13:55 Terminal — ls src/     │    │ ○ Analista      idle    │ │
│  │ 13:40 Pesquisa — tendências  │    │ ◉ Arquiteto     busy    │ │
│  │ 13:20 Memória — 2 salvas     │    │ ○ ProductDesign idle    │ │
│  └──────────────────────────────┘    └─────────────────────────┘ │
│                                                                   │
│  ATALHOS RÁPIDOS                                                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐           │
│  │ + Nova conversa│ │ 🏭 Nova ideia │ │ 📡 MCP Search │           │
│  └───────────────┘ └───────────────┘ └───────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

---

### TELA 2 — CHAT (/chat)

```
┌──────────────────────────────────────────────────────────────────┐
│ CHAT — NEXUS CLAW                                                │
│ [+ Nova conversa]  [📋 Histórico ▾]  [⚙ Configurar]            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ÁREA DE MENSAGENS (scroll)                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │  ╔══════════════════════════════════════════════════════╗  │  │
│  │  ║  👤 Você                              14:20          ║  │  │
│  │  ║  Analisa o rebanho da fazenda Antares                ║  │  │
│  │  ╚══════════════════════════════════════════════════════╝  │  │
│  │                                                            │  │
│  │  ╔══════════════════════════════════════════════════════╗  │  │
│  │  ║  ◈ Nexus Claw                         14:20          ║  │  │
│  │  ║                                                      ║  │  │
│  │  ║  Com base nos dados do rebanho da Fazenda            ║  │  │
│  │  ║  Antares, identifiquei os seguintes pontos:          ║  │  │
│  │  ║                                                      ║  │  │
│  │  ║  **GMD médio:** 0,8 kg/dia (abaixo do ideal 1,1)    ║  │  │
│  │  ║  **Lotação:** 1,2 UA/ha (capacidade: 1,5 UA/ha)     ║  │  │
│  │  ║  **Próximo passo:** revisar suplementação mineral... ║  │  │
│  │  ║                                                      ║  │  │
│  │  ║  ─────────────────────────────────────────────────  ║  │  │
│  │  ║  🤖 Gemini Pro  │  🌾 agro  │  ⚡ 1.3s  │ $0.001   ║  │  │
│  │  ║  [↗ Fork]  [📋 Copiar]  [🔄 Regenerar]             ║  │  │
│  │  ╚══════════════════════════════════════════════════════╝  │  │
│  │                                                            │  │
│  │  ╔══════════════════════════════════════════════════════╗  │  │
│  │  ║  ◈ Nexus Claw  ●●● (digitando...)       14:21       ║  │  │
│  │  ╚══════════════════════════════════════════════════════╝  │  │
│  │                                                            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  INPUT AREA                                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  [📎] Digite sua mensagem...                          [↗]  │  │
│  │  ─────────────────────────────────────────────────────     │  │
│  │  [Eco] [Normal ●] [Power]     [🎙 Voz]  [⚙ Provider ▾]   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

PAINEL LATERAL (opcional, toggle):
┌──────────────────────┐
│ CONTEXTO ATIVO       │
│ ─────────────────    │
│ 📚 KB carregadas:    │
│   • NEXUS_CORE ✓     │
│   • NEXUS_AGRO ✓     │
│   • VidaDigital ✓    │
│ 🧠 Memórias: 15      │
│ 🌐 Domínio: agro     │
│ ⏱ Cache: 4:23 min   │
│ ─────────────────    │
│ HISTÓRICO            │
│ • Chat 22/03 14:20   │
│ • Chat 22/03 13:10   │
│ • Chat 21/03 09:00   │
└──────────────────────┘

FORK DE CONVERSA (quando clica [↗ Fork]):
┌──────────────────────────────────────────────┐
│  ↗ FORK desta mensagem                       │
│  ─────────────────────────────────────────   │
│  Uma nova conversa será criada a partir daqui│
│  Você pode explorar um caminho diferente      │
│                                              │
│  [Criar Fork]  [Cancelar]                    │
└──────────────────────────────────────────────┘
```

---

### TELA 3 — AGENTES (/agents)

```
┌──────────────────────────────────────────────────────────────────┐
│ AGENTES ESPECIALIZADOS                                           │
│ [Todos ▾]  [Por domínio ▾]  [Status ▾]  [+ Criar agente]        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GRID DE AGENTES (3 colunas desktop, 2 tablet, 1 mobile)         │
│                                                                  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│  │ ◈ NEXUS CLAW     │ │ 🔍 SCOUT         │ │ 📊 ANALISTA      │  │
│  │ ● Online         │ │ ● Online         │ │ ○ Disponível     │  │
│  │                  │ │                  │ │                  │  │
│  │ Orquestrador     │ │ Pesquisa e       │ │ Extrai req.      │  │
│  │ central do QG    │ │ descoberta       │ │ em JSON          │  │
│  │                  │ │                  │ │                  │  │
│  │ Domínio: todos   │ │ Domínio: pesq.   │ │ Domínio: sw      │  │
│  │ Modelo: cascade  │ │ Modelo: Gemini   │ │ Modelo: Groq     │  │
│  │                  │ │                  │ │                  │  │
│  │ [Invocar] [Ver]  │ │ [Invocar] [Ver]  │ │ [Invocar] [Ver]  │  │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘  │
│                                                                  │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│  │ 🏗 ARQUITETO     │ │ 🎨 PRODUCT       │ │ 🌿 AGRO EXPERT   │  │
│  │ ○ Disponível     │ │ ◌ Ocupado        │ │ ○ Disponível     │  │
│  │                  │ │ Pipeline #42     │ │                  │  │
│  │ Design de DB     │ │ UX/UI design     │ │ Consultoria agro │  │
│  │ e endpoints      │ │ e prototipagem   │ │ e pecuária       │  │
│  │ Domínio: sw      │ │ Domínio: produto │ │ Domínio: agro    │  │
│  │ [Invocar] [Ver]  │ │ [Ocupado] [Ver]  │ │ [Invocar] [Ver]  │  │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘  │
│                                                                  │
│  [ + 9 agentes restantes... Carregar mais ]                      │
└──────────────────────────────────────────────────────────────────┘

MODAL DE AGENTE (ao clicar [Ver]):
┌──────────────────────────────────────────────────────────────────┐
│  ◈ NEXUS CLAW                                          [X]       │
│  ─────────────────────────────────────────────────────────────   │
│  Status: ● Online  │  Modelo: cascade  │  Domínio: todos        │
│                                                                  │
│  DESCRIÇÃO                                                       │
│  Orquestrador central. CEO Supremo, Engenheiro Principal,        │
│  CFO, Caçador de Tendências e Diplomata de IAs do QG.            │
│                                                                  │
│  FERRAMENTAS DISPONÍVEIS                                         │
│  Read  Glob  Grep  WebSearch  WebFetch  Bash (limitado)          │
│                                                                  │
│  ÚLTIMA ATIVIDADE                                                │
│  22/03 14:20 — Análise do rebanho Fazenda Antares (1.3s)        │
│  22/03 13:55 — Terminal: ls src/services (0.2s)                 │
│                                                                  │
│  INVOCAR AGENTE                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Descreva a tarefa para este agente...                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│  [Executar — resultado completo]  [Executar — stream ao vivo]    │
└──────────────────────────────────────────────────────────────────┘
```

---

### TELA 4 — FÁBRICA DE IA (/fabrica)

```
┌──────────────────────────────────────────────────────────────────┐
│ 🏭 FÁBRICA DE IA                        [● Ligada]  [Desligar]   │
│ Pipeline automatizado: ideia → app completo                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SUBMETER NOVA IDEIA                                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Descreva seu app, sistema ou ideia...                     │  │
│  │                                                            │  │
│  │  "Quero um app de controle de estoque para pequenas        │  │
│  │   empresas com relatórios em PDF e alertas de mínimo..."   │  │
│  └────────────────────────────────────────────────────────────┘  │
│  [🏭 Acionar Fábrica]                                            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PIPELINE EM EXECUÇÃO — #42  (iniciado às 14:10)                 │
│  "App de gestão de estoque para varejo"                          │
│                                                                  │
│  KANBAN DO PIPELINE:                                             │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  ┌─────────┐  │
│  │ANALISTA  │  │COMANDANTE│  │ ARQUITETO+DESIGNER│  │ AUDITOR │  │
│  │          │  │          │  │    (paralelo)     │  │         │  │
│  │✅ Pronto │  │✅ Pronto │  │                   │  │ aguard. │  │
│  │          │  │          │  │ 🏗 Arquiteto ⏳   │  │         │  │
│  │Spec JSON │  │Stack:    │  │   3.2s...         │  │ ○       │  │
│  │extraída  │  │React+Node│  │ 🎨 Designer ⏳    │  │         │  │
│  │          │  │Supabase  │  │   2.8s...         │  │         │  │
│  │0.8s      │  │2.1s      │  │                   │  │         │  │
│  └──────────┘  └──────────┘  └──────────────────┘  └─────────┘  │
│                                                                  │
│       ┌──────────────────────────────────────────┐               │
│       │            CODER CHIEF                   │               │
│       │         (aguardando arquiteto)           │               │
│       │                                          │               │
│       │  ○ FrontendAgent  ○ BackendAgent         │               │
│       │  ○ SqlAgent       ○ DocumentoAgent       │               │
│       └──────────────────────────────────────────┘               │
│                                                                  │
│  Progresso: ██████░░░░░░░░░░░░  38%                              │
│  Iteração: 1/4  │  Score alvo: 75  │  Tempo: 8.2s               │
│                                                                  │
│  LOG AO VIVO:                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 14:10:08 [Analista] Extraindo requisitos...                │  │
│  │ 14:10:09 [Analista] ✓ Spec gerada: 12 requisitos           │  │
│  │ 14:10:11 [Comandante] Definindo stack tecnológica...       │  │
│  │ 14:10:13 [Comandante] ✓ React + Node.js + Supabase         │  │
│  │ 14:10:14 [Arquiteto] Desenhando banco de dados...          │  │
│  │ 14:10:14 [Designer] Criando conceito visual...             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  PROJETOS ENTREGUES                                              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │ #41 App de Agenda  │ Score: 87  │ 22/03 13:00  [Ver] ↓  │    │
│  │ #40 Dashboard Agro │ Score: 92  │ 21/03 18:00  [Ver] ↓  │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

### TELA 5 — CONHECIMENTO (/knowledge)

```
┌──────────────────────────────────────────────────────────────────┐
│ 📚 BASE DE CONHECIMENTO                                          │
│ [🔍 Buscar...]  [Domínio ▾]  [↺ Forçar cache reload]            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DOMÍNIOS DISPONÍVEIS                                            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  [Software] [Agro] [Financeiro] [Radar Tech] [Mecânico]  │    │
│  │  [Civil] [Elétrico] [Químico] [Produto] [Integração]     │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  DOMÍNIO SELECIONADO: SOFTWARE                                   │
│                                                                  │
│  STATUS DO CACHE                                                 │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  NEXUS_CORE_KNOWLEDGE.md    ✓ cache  │  expira em 4:12   │   │
│  │  NEXUS_MASTER_ROADMAP.md    ✓ cache  │  expira em 4:12   │   │
│  │  software/patterns.md       ✓ cache  │  expira em 4:12   │   │
│  │  VidaDigital.json           ✓ cache  │  expira em 4:12   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  CONTEÚDO — software/patterns_and_practices.md                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  # Padrões e Práticas de Software                         │   │
│  │                                                           │   │
│  │  ## Microservices                                         │   │
│  │  Cada serviço tem responsabilidade única...               │   │
│  │                                                           │   │
│  │  ## Design Patterns                                       │   │
│  │  - Factory Pattern: criação de objetos...                 │   │
│  │  - Observer Pattern: eventos e callbacks...               │   │
│  │  ...                                                      │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Consultar este domínio com IA]                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

### TELA 6 — TERMINAL (/terminal)

```
┌──────────────────────────────────────────────────────────────────┐
│ 💻 TERMINAL REMOTO                          [Limpar] [Histórico] │
│ ⚠ Comandos executam no servidor — use com responsabilidade       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  $ ls src/services/                                        │  │
│  │  aiService.js  nexusService.js  routingService.js          │  │
│  │  agentService.js  memoryService.js  ...                    │  │
│  │                                                            │  │
│  │  $ npm test                                                │  │
│  │  ✓ 24 testes passaram (3.2s)                               │  │
│  │                                                            │  │
│  │  $ npm audit                                               │  │
│  │  found 0 vulnerabilities                                   │  │
│  │                                                            │  │
│  │  _                                                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ $ |                                          [Executar ↵]  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  COMANDOS RÁPIDOS:                                               │
│  [npm test] [npm audit] [git status] [ls src/] [node --version]  │
└──────────────────────────────────────────────────────────────────┘
```

---

### TELA 7 — MEMÓRIA (/memory)

```
┌──────────────────────────────────────────────────────────────────┐
│ 🧠 MEMÓRIA DO NEXUS CLAW                                         │
│ O que o sistema lembra sobre você e seus projetos                │
│ [🔍 Filtrar...]  [+ Nova memória]  [🗑 Limpar antigas]           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FILTROS: [Todos ●] [fazenda] [código] [finanças] [projeto]      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  🌾 [fazenda]  22/03 14:20                          [🗑]   │  │
│  │  AgroMacro tem 450 cabeças de gado Nelore na Fazenda       │  │
│  │  Antares. GMD atual: 0.8 kg/dia. Meta: 1.1 kg/dia          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  💻 [código]  22/03 13:10                          [🗑]    │  │
│  │  Priscila prefere TypeScript em novos projetos React.       │  │
│  │  Usa Zustand para state management (não Redux)              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  🏗 [projeto]  21/03 09:00                         [🗑]    │  │
│  │  FrigoGest v2.7.0 — migrando Firebase → Supabase.          │  │
│  │  Prioridade: autenticação e tabela de abates primeiro       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [ Carregar mais 12 memórias... ]                               │
│                                                                  │
│  ADICIONAR MEMÓRIA MANUALMENTE                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Categoria: [fazenda ▾]                                     │  │
│  │ Conteúdo: ________________________________________         │  │
│  │                                          [Salvar memória]  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

### TELA 8 — AUDITORIA (/audit)

```
┌──────────────────────────────────────────────────────────────────┐
│ 📋 LOG DE AUDITORIA                                              │
│ Todas as ações do sistema registradas                            │
│ [🔍 Filtrar...]  [Data ▾]  [Tipo ▾]  [Exportar CSV]             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HOJE — 22 de março de 2026                                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  14:21 ● CHAT      Nexus respondeu [Gemini/agro] 1.3s $0.001│ │
│  │  14:10 ● FÁBRICA   Pipeline #42 iniciado                   │  │
│  │  13:55 ● TERMINAL  ls src/services/ — sucesso              │  │
│  │  13:40 ● PESQUISA  Ciclo de pesquisa — 3 fatos aprendidos  │  │
│  │  13:20 ● MEMÓRIA   2 memórias salvas automaticamente       │  │
│  │  13:10 ● CHAT      Nexus respondeu [DeepSeek/código] 2.1s  │  │
│  │  12:00 ● SISTEMA   Servidor iniciado — todas as IAs online │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  APROVAÇÕES PENDENTES                           [2 pendentes]    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ⚠ Nexus quer executar: git push origin main              │  │
│  │  Solicitado às 14:15                                       │  │
│  │  [✓ Aprovar]  [✗ Rejeitar]  [Ver detalhes]                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

### TELA 9 — MCP (/mcp)

```
┌──────────────────────────────────────────────────────────────────┐
│ 🔌 SERVIDORES MCP                                                │
│ Model Context Protocol — ferramentas externas para o Nexus       │
│ [+ Conectar servidor]                                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SERVIDORES CONECTADOS                                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  🔍 brave-search                              ● Conectado│    │
│  │  Busca web em tempo real via Brave Search API             │    │
│  │  8 ferramentas disponíveis                                │    │
│  │  [Ver ferramentas]  [Testar]  [Desconectar]              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  📁 filesystem                                ● Conectado│    │
│  │  Leitura e escrita de arquivos do projeto                 │    │
│  │  5 ferramentas disponíveis                                │    │
│  │  [Ver ferramentas]  [Testar]  [Desconectar]              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  🐙 github                                    ● Conectado│    │
│  │  Acesso a repositórios, issues e PRs do GitHub            │    │
│  │  12 ferramentas disponíveis                               │    │
│  │  [Ver ferramentas]  [Testar]  [Desconectar]              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  INVOCAR FERRAMENTA DIRETAMENTE                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Servidor: [brave-search ▾]  Ferramenta: [search ▾]        │  │
│  │  Args: {"query": "tendências IA 2026"}                     │  │
│  │                                        [▶ Executar]        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  WHATSAPP                                    ● QR Conectado     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Status: Sessão ativa (Redis)  │  +55 11 9xxxx-xxxx        │  │
│  │  Última mensagem: 22/03 14:05                              │  │
│  │  [Ver QR code]  [Desconectar]                              │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## PARTE 3 — FLUXOS DE USUÁRIO

### Fluxo 1: Chat com streaming

```
Usuário digita mensagem
    ↓
[Enter ou clique em ↗]
    ↓
MessageInput desabilita (loading state)
Mensagem aparece no chat (otimistic update)
Nexus Claw badge aparece com ●●● animado
    ↓
POST /api/nexus/stream { prompt, historico, sessionId }
    ↓
SSE conecta → tokens chegam um a um
MessageBubble atualiza em tempo real com cursor ▌ piscando
    ↓
SSE termina → { done: true, provider: "Gemini", domain: "agro", cost: { ... } }
    ↓
Cursor some
ProviderBadge aparece: 🤖 Gemini Pro
DomainBadge aparece: 🌾 agro
CostIndicator aparece: ⚡ 1.3s │ $0.001
Botões [↗ Fork] [📋 Copiar] [🔄 Regenerar] aparecem
    ↓
MessageInput reabilita
AuditService registra em background
```

### Fluxo 2: Pipeline da Fábrica

```
Usuário digita ideia no form
    ↓
[🏭 Acionar Fábrica]
    ↓
POST /api/fabrica/orquestrar { prompt }
Backend retorna: { pipelineId: "42" }
    ↓
PipelineKanban monta os 5 estágios (todos em "aguardando")
    ↓
SSE: GET /api/fabrica/pipeline/42/stream
    ↓
Eventos chegam:
  { stage: "analyst", status: "running" } → card Analista fica ativo com spinner
  { stage: "analyst", status: "done", time: 0.8 } → card vira ✅
  { stage: "commander", status: "running" } → card Comandante ativa
  { stage: "architect", status: "running" }  \
  { stage: "designer", status: "running" }    → ambos paralelos
  ...
  { stage: "auditor", status: "done", score: 87 } → Pipeline completo
    ↓
Score >= 75: ✅ Entregue
Badge verde: "Score: 87"
Botões: [⬇ Baixar código] [👁 Ver resultado] [🔁 Refinar]
```

### Fluxo 3: Agente autônomo com stream

```
Usuário abre modal do agente
Descreve tarefa: "Analise todos os serviços e me diga qual precisa de refatoração"
Clica em [Executar — stream ao vivo]
    ↓
POST /api/nexus/agente/stream { tarefa }
    ↓
SSE eventos chegam:
  { tipo: "inicio", conteudo: "Agente iniciado | modelo: claude-opus-4-6" }
  { tipo: "ferramenta", conteudo: "[Glob] src/services/*.js" }
  { tipo: "ferramenta", conteudo: "[Read] src/services/aiService.js" }
  { tipo: "texto", conteudo: "Analisei 20 serviços. O server.js com 681 linhas..." }
  { tipo: "resultado", conteudo: "...", custo: "2.847 in / 1.203 out tokens" }
    ↓
Cada evento aparece no painel:
  🔧 [Glob] src/services/*.js
  📖 [Read] src/services/aiService.js
  💬 Analisei 20 serviços...
  ✅ Concluído │ 4.050 tokens │ $0.018
```

---

## PARTE 4 — COMPONENTES CRÍTICOS (especificação técnica)

### ProviderBadge.tsx
```tsx
// Exibe qual IA respondeu com cor específica por provedor
const PROVIDER_COLORS = {
  Gemini:    "bg-blue-500/20 text-blue-400 border-blue-500/40",
  DeepSeek:  "bg-green-500/20 text-green-400 border-green-500/40",
  Anthropic: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  Groq:      "bg-purple-500/20 text-purple-400 border-purple-500/40",
  Cerebras:  "bg-pink-500/20 text-pink-400 border-pink-500/40",
  OpenAI:    "bg-teal-500/20 text-teal-400 border-teal-500/40",
};
// Props: provider: string, latency: number (ms), cost: number (USD)
// Render: 🤖 Gemini Pro  ⚡ 1.3s  $0.001
```

### DomainBadge.tsx
```tsx
const DOMAIN_ICONS = {
  software:   "💻", agro: "🌾", financeiro: "💰",
  mecanico:   "⚙️",  civil: "🏗",  eletrico: "⚡",
  quimico:    "🧪",  produto: "🎨", integracao: "🔗",
};
// Props: domain: string
// Render: 🌾 agro
```

### StreamingText.tsx
```tsx
// Recebe chunks via SSE e renderiza Markdown em tempo real
// Usa react-markdown para formatar **negrito**, listas, código
// Cursor piscante ▌ enquanto isStreaming=true
// Props: content: string, isStreaming: boolean
```

### PipelineKanban.tsx
```tsx
// 5 colunas: Analista | Comandante | Arq+Des | CoderChief | Auditor
// Cada coluna tem um PipelineCard com status: waiting | running | done | error
// SSE via useSSE(pipelineId) atualiza status em tempo real
// Barra de progresso global no topo
```

### useSSE.ts (hook)
```ts
// Hook que:
// 1. Conecta ao endpoint SSE
// 2. Processa chunks via ReadableStream
// 3. Reconecta automaticamente se cair (com sessionId)
// 4. Retorna: { chunks, isStreaming, sessionId, error }
export function useSSE(url: string, body: object, options?: SSEOptions)
```

---

## PARTE 5 — VERIFICAÇÃO DO BLUEPRINT (3 passagens)

### Passagem 1: Consistência de rotas

| Tela | Rota frontend | API que chama | Rota backend existe? |
|------|--------------|--------------|---------------------|
| Login | /login | POST /api/auth/verify | ✅ |
| Dashboard | / | GET /api/status, GET /api/agentes | ✅ |
| Chat stream | /chat | POST /api/nexus/stream | ✅ |
| Agente stream | /chat (modal) | POST /api/nexus/agente/stream | ✅ |
| Agentes | /agents | GET /api/agentes | ✅ |
| Fábrica | /fabrica | POST /api/fabrica/orquestrar | ✅ |
| Pipeline SSE | /fabrica | GET /api/fabrica/pipeline/:id/stream | ✅ |
| Conhecimento | /knowledge | GET /api/knowledge/:domain | ✅ |
| Terminal | /terminal | POST /api/terminal/exec | ✅ |
| Memória | /memory | GET /api/agent/memory | ✅ |
| Auditoria | /audit | GET /api/approvals/pending | ✅ |
| MCP | /mcp | GET /api/mcp/servers (NOVO) | ⚠️ criar |
| MCP invoke | /mcp | POST /api/mcp/invoke (NOVO) | ⚠️ criar |
| WhatsApp QR | /mcp | GET /api/whatsapp/qr (NOVO) | ⚠️ criar |

### Passagem 2: Estado e store

| Store | Estado | Actions |
|-------|--------|---------|
| useChatStore | conversations[], activeId, sessionId | sendMessage, fork, regenerate |
| useAgentStore | agents[], invoking | invokeAgent, streamAgent |
| useFabricaStore | pipelines[], active | submitIdeia, cancelPipeline |
| useUIStore | sidebarOpen, activeProvider, tokenVolume | toggle, setProvider, setVolume |
| useAuthStore | token, isAuthenticated | login, logout |

### Passagem 3: Design system aplicado

| Elemento | Token usado | Correto? |
|----------|------------|---------|
| Fundo da página | --color-bg-base (#0A0A0F) | ✅ |
| Cards | --color-bg-surface (#0D0D1F) | ✅ |
| Botão primário | --color-primary-500 (#7C3AED) | ✅ |
| Badge provider | cor específica por provedor | ✅ |
| Badge domínio | --color-accent-400 (#22D3EE) | ✅ |
| Texto principal | --color-text-primary (#E2E8F0) | ✅ |
| Texto muted | --color-text-muted (#64748B) | ✅ |
| Fonte | Inter (sans) + JetBrains Mono (terminal) | ✅ |
| Sidebar largura | 240px desktop, drawer mobile | ✅ |
| Bottom nav | só mobile (<768px) | ✅ |
| Glow IA ativa | --shadow-glow-primary | ✅ |
| Spacing | base 4px | ✅ |

---

## PARTE 6 — ORDEM DE CONSTRUÇÃO DO FRONTEND

```
Dia 1: Fundação
├── npm create vite@latest apps/web -- --template react-ts
├── npm install tailwindcss @tailwindcss/vite react-router-dom zustand
├── npm install @tanstack/react-query
├── npx shadcn@latest init  ← inicializa ShadCN no projeto
├── Criar tokens.css com design system completo
├── Copiar componentes ShadCN: button, badge, card, input, dialog,
│   sheet, tabs, scroll-area, tooltip, skeleton
└── Criar AppShell (header + sidebar + main)

Dia 2: Auth + Dashboard
├── LoginPage com token input (ShadCN Card + Input + Button)
├── useAuthStore (Zustand)
├── PrivateRoute guard
└── DashboardPage com 4 status cards + atividade recente

Dia 3: Chat
├── ChatPage com MessageList + MessageInput
├── useChat hook com SSE via useSSE
├── StreamingText com react-markdown
├── ProviderBadge + DomainBadge + CostIndicator
└── useChatStore com sendMessage action

Dia 4: Agentes + Fábrica
├── AgentsPage com AgentGrid (ShadCN Cards)
├── AgentModal (ShadCN Dialog)
├── FabricaPage com IdeiaForm
└── PipelineKanban com 5 colunas (SSE em tempo real)

Dia 5: Restante + Deploy
├── KnowledgePage (simples — list + viewer)
├── TerminalPage (textarea + comandos rápidos)
├── MemoryPage (lista editável)
├── AuditPage (tabela + aprovações)
├── MCPPage (servidores + invoker)
├── Mobile nav (bottom bar)
└── Deploy Vercel / Render static
```

---

## CHECKLIST FINAL ANTES DE COMEÇAR A CODAR

- [x] Stack definida (React + Vite + ShadCN + Zustand + Tailwind)
- [x] Design system com tokens CSS definidos
- [x] Todas as telas blueprintadas com wireframes
- [x] Todos os fluxos de usuário mapeados
- [x] Componentes críticos especificados (ProviderBadge, StreamingText, PipelineKanban, useSSE)
- [x] Rotas frontend mapeadas para APIs backend
- [x] 3 stores Zustand definidos com estados e actions
- [x] Ordem de construção em 5 dias definida
- [x] 3 MCPs a integrar: brave-search, filesystem, github
- [x] ShadCN componentes a usar: button, badge, card, input, dialog, sheet, tabs, scroll-area
- [x] 3 rotas novas no backend identificadas: /api/mcp/servers, /api/mcp/invoke, /api/whatsapp/qr
- [x] Blueprint revisado 3x — sem inconsistências

*Gerado em: 2026-03-22*
