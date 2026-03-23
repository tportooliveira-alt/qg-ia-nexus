# 12 — Análise Profunda + Plano Final do Projeto

> Gerado após varredura completa de TODOS os arquivos do PC.
> Leitura de 100+ arquivos, testes rodados, fragmentos localizados.
> Data: 2026-03-23

---

## O QUE FOI ENCONTRADO — INVENTÁRIO TOTAL

### Projetos encontrados no PC

| Projeto | Caminho | Stack | GitHub | Status |
|---------|---------|-------|--------|--------|
| QG IA Nexus | `C:\qg-ia-nexus\` | Node.js + Express | ✅ Sim | ✅ Online (Render) |
| Fábrica de IA | `C:\fabrica-ia-api\` | Node.js + 15 agentes | ✅ Sim | ✅ Online (Render) |
| AgroMacro PWA | `C:\tmp-repos\AgroMacro\` | Vanilla JS PWA | ❓ Verificar | 🟡 Local, sem deploy |
| AgroMacro React | `C:\tmp-repos\GESTAO-DA-FAZENDA-ANTARES\` | React 19 + Vite + TS | ❌ NÃO | 🔴 Apenas estrutura |
| IdeaOrganizer | `C:\IdeaOrganizer\server\` | Node.js + SQLite | ❓ | 🟡 Só tem .sqlite |
| QG-IA-NOVO (LIXO) | `C:\Desktop\QG-IA-NOVO\` | — | ❌ | ⚠️ Versão velha |

> **FrigoGest excluído conforme instrução da Priscila.**

---

## DESCOBERTAS CRÍTICAS (o que mudou o plano)

### 🔴 DESCOBERTA 1 — GESTAO-DA-FAZENDA-ANTARES É O AGROMACRO REACT

O `GESTAO-DA-FAZENDA-ANTARES` não é um app de fazenda diferente.
É a **versão React 19 + TypeScript + Vite do AgroMacro**, com:
- **@google/genai** — Gemini integrado (ChatInterface.tsx)
- **react-leaflet + leaflet** — Mapa interativo de pastos (InteractiveMap.tsx)
- **React 19 + lucide-react** — Interface moderna
- `package.json` com `name: "agromacro:-gestão-de-pecuária"`

**Decisão:** Este é o AgroMacro v2. Não são dois projetos — são duas versões do mesmo.

### 🔴 DESCOBERTA 2 — CHAVES DE API NÃO FORAM ROTACIONADAS

O `ROTACAO_CHAVES_CHECKLIST.md` do Desktop confirma:
- [x] Apenas QG_AUTH_TOKEN foi rotacionado
- [ ] Gemini, Groq, DeepSeek, Anthropic, Cerebras — **AINDA NÃO ROTACIONADOS**

As chaves expostas no arquivo `.txt` do Desktop são **potencialmente as mesmas em uso**.
**Ação obrigatória: rotar TODAS as chaves ANTES de qualquer outro trabalho.**

### 🟡 DESCOBERTA 3 — DESKTOP/GADO É NEGÓCIO REAL

A pasta `Desktop\GADO\` contém dados reais de negócio:
- GTAs (Guia de Trânsito Animal) — documentos legais para transporte de gado
- Planilha de fluxo de caixa de clientes (ALOISIO, etc.)
- Fotos de animais
- "344mil price.pdf" — negociação de gado

**Contexto:** Priscila está no negócio de compra/venda de gado. AgroMacro não é só um projeto — é uma necessidade real do dia a dia.

### 🟡 DESCOBERTA 4 — WHATSAPP-CLAUDE-BOT NÃO EXISTE

O `PLANO_CIRURGIA_PC.md` menciona `whatsapp-claude-bot` em `tmp-repos\`, mas ele **não existe lá**.
Os três repos em tmp-repos são: AgroMacro, GESTAO-DA-FAZENDA-ANTARES, fabrica-ia-api (v2.0.0).

### 🟡 DESCOBERTA 5 — BACKUP DO GOOGLE DRIVE INCOMPLETO

Status do backup (arquivo CHECKPOINT_BACKUP_AMANHA.md):
- `.gemini` — 20GB ainda pendente
- `qg-ia-nexus` — **NÃO COPIADO**
- `fabrica-ia-api` — **NÃO COPIADO**
- `tmp-repos` — **NÃO COPIADO**

**Risco:** Se o PC morrer agora, perde QG Nexus, Fábrica, AgroMacro, AgroMacro React.

### 🟡 DESCOBERTA 6 — ANTIGRAVITY MCP JÁ ESTÁ INSTALADO

O backup confirma pasta `.antigravity` no PC. O arquivo `PROMPTS_ANTIGRAVITY_MCP.md` detalha
como usar Antigravity para scaffolding de projetos com filesystem MCP.
**É um MCP local já configurado** — pode ser usado agora para montar a estrutura do monorepo.

### 🟢 DESCOBERTA 7 — AGROMACRO TEM TESTES PLAYWRIGHT

O AgroMacro Vanilla tem dois scripts de teste profissionais:
- `test_app.py` — testa todas as 27 views, KPIs, botões, onclick handlers, imagens
- `test_errors.py` — testa funções críticas, event counts, navegação
Escritos em Python com Playwright. Podem rodar com `python test_app.py` após `npx http-server`.

### 🟢 DESCOBERTA 8 — TODOS OS TESTES DO QG PASSAM

```
npm test → All tests passed. ✅
```
O backend está sólido. Sem regressões.

---

## MAPA COMPLETO DO ECOSSISTEMA (revisado)

```
NEGÓCIO REAL DA PRISCILA
├── Compra/Venda de Gado (GADO/ no Desktop)
│   └── Clientes, GTAs, notas, fluxo de caixa
│
├── AgroMacro — Gestão da Fazenda
│   ├── v1: PWA Vanilla JS (27 módulos, offline-first) ← PRODUÇÃO
│   └── v2: React + Gemini + Mapa (GESTAO-DA-FAZENDA-ANTARES) ← EM DEV
│
└── QG IA Nexus — Cérebro Digital Central
    ├── Backend: 20 serviços, 36 rotas, 6 IAs em cascata
    ├── Fábrica de IA: 15 agentes, pipeline automatizado
    ├── Dashboard: dashboard.html (56KB) → React v2 planejado
    └── WhatsApp Bot: conecta tudo via Zap
```

---

## ESTADO REAL DE CADA COMPONENTE

### QG IA Nexus — backend

| Componente | Estado | Observação |
|-----------|--------|-----------|
| server.js (681 linhas) | ⚠️ Funcional mas monolítico | 36 rotas num arquivo |
| aiService.js (cascade) | ✅ Funcional | Gemini→DeepSeek→Anthropic→Groq→Cerebras→OpenAI |
| nexusService.js | ✅ Cache 5min + parallel load | Melhorado nesta sessão |
| agentService.js | ✅ Claude Agent SDK integrado | Novo |
| terminalService.js | ✅ Auto-healing 3 tentativas | IA corrige comandos falhos |
| researchService.js | ✅ Pesquisa autônoma a cada 6h | Avisa no WhatsApp |
| evolutionService.js | ✅ Salva fatos aprendidos | learned_facts.json + Supabase |
| WhatsApp (Baileys) | 🔴 Perde sessão no Render | Precisa Redis/Supabase Storage |
| MySQL (Hostinger) | 🔴 Bloqueado no Render | Hostinger bloqueia IP externo |
| dashboard.html | ⚠️ 56KB inline, não evolui | Fase 2: React |

### QG IA Nexus — frontend (dashboard.html)

Os JS soltos (explorer.js, vidente.js, governance.js) são **fragmentos do dashboard** que foram
extraídos mas não integrados. Contêm:
- **Explorer**: Agente que pesquisa novidades de IA na web via Gemini Grounding
- **Vidente**: Sistema de diagnóstico em 3 tempos (passado/presente/futuro) + 2 ângulos
- **Governance**: UI para aprovar/negar pendências de agentes

Estes três são features premium que precisam ser incorporadas no React v2.

### AgroMacro v2 (GESTAO-DA-FAZENDA-ANTARES)

O React app tem:
- Dashboard com KPIs
- Gestão de lotes (com dados mock)
- Inventário de insumos
- Financeiro (compra/venda/fluxo)
- Manejo sanitário
- **ChatInterface.tsx** — chat com Gemini para consultas agro
- **InteractiveMap.tsx** — mapa de pastos com Leaflet

Faltam: persistência real (usa state local/mock), integração com QG Nexus, offline-first.

---

## PLANO FINAL — ORDEM DE EXECUÇÃO

### ⚡ HOJE (30 minutos) — SEGURANÇA OBRIGATÓRIA

**1. Rotar TODAS as chaves de API** (nos painéis de cada provedor):
- [ ] Gemini → aistudio.google.com
- [ ] Groq → console.groq.com
- [ ] DeepSeek → platform.deepseek.com
- [ ] Anthropic → console.anthropic.com
- [ ] Cerebras → cloud.cerebras.ai
- [ ] Supabase → projeto → Settings → API

**2. Atualizar .env com as novas chaves**
```bash
# No qg-ia-nexus/.env — substituir as chaves antigas pelas novas
```

**3. Deletar o arquivo de chaves do Desktop**
```bash
del "C:\Users\Priscila\Desktop\QG-IA-NOVO\GEMINI_API_KEY=AIzaSyD20IBqyZ4IlNSn.txt"
```

---

### 📦 SEMANA 1 — ORGANIZAÇÃO E BACKUP

**GitHub para AgroMacro React (GESTAO-DA-FAZENDA-ANTARES):**
```bash
cd C:\Users\Priscila\tmp-repos\GESTAO-DA-FAZENDA-ANTARES
gh repo create agromacro-react --private
git init && git add . && git commit -m "feat: AgroMacro v2 — React 19 + Vite + Gemini + Mapa"
git push -u origin main
```

**Backup Google Drive (retomar de onde parou):**
Retomar em ordem:
1. `.gemini` (20GB — o maior)
2. `qg-ia-nexus`
3. `fabrica-ia-api`
4. `tmp-repos`

**Limpar Desktop:**
- Deletar `Desktop\QG-IA-NOVO\` (é cópia velha de 3 dias atrás)
- Manter apenas: `Desktop\GADO\` (negócio real) e atalhos úteis

---

### 🏗️ FASE 0 — MONOREPO (2h) — PRÓXIMA PRIORIDADE TÉCNICA

Criar estrutura profissional única:
```
qg-ia-nexus/
├── package.json (workspaces)
├── turbo.json
├── apps/
│   ├── api/       ← mover server.js + src/ para cá
│   └── web/       ← React v2 (novo)
└── packages/
    └── shared/    ← tipos TypeScript compartilhados
```

Mover sem modificar — apenas reorganizar pastas.
Testar `npm start` em `apps/api` antes de continuar.

---

### 🔧 FASE 1 — BACKEND REFACTOR (4h)

Quebrar `server.js` (681 linhas) em 12 route files:

| Route file | Rotas |
|-----------|-------|
| `nexus.routes.js` | /api/nexus/* (6 rotas) |
| `agent.routes.js` | /api/agentes/*, /api/nexus/agente/* |
| `fabrica.routes.js` | /api/fabrica/* (9 rotas) |
| `knowledge.routes.js` | /api/knowledge/*, /api/domain-detect |
| `memory.routes.js` | /api/agent/memory |
| `approval.routes.js` | /api/approvals/* |
| `terminal.routes.js` | /api/terminal/exec |
| `fs.routes.js` | /api/fs/* |
| `skills.routes.js` | /api/skills/factory |
| `config.routes.js` | /api/config/* |
| `status.routes.js` | /api/status, /api/auth/verify |
| `mcp.routes.js` | /api/mcp/* (novo) |

Novo `server.js` com ~50 linhas. **Não alterar lógica — só mover.**

---

### 🎨 FASE 2 — FRONTEND REACT MVP (20h)

Stack: **React 19 + Vite + TypeScript + TailwindCSS v4 + ShadCN/ui**

**Ordem de build (5 dias):**

**Dia 1 — Base**
- `apps/web/` com Vite + React + TS + Tailwind
- `tokens.css` — design system completo (cores roxo/ciano, tipografia, sombras)
- `AppShell` — header + sidebar 240px desktop + hamburger mobile

**Dia 2 — Auth + Chat**
- `LoginPage` — auth por token
- `ChatPage` — SSE streaming token a token
- `MessageBubble` com `ProviderBadge` + `DomainBadge` + custo USD

**Dia 3 — Agentes + Fábrica**
- `AgentsPage` — grid de 15 agentes com status
- `FabricaPage` — `PipelineKanban` (kanban das 8 etapas do pipeline em tempo real)
- `Explorer` integrado — pesquisa de novidades IA (do explorer.js)

**Dia 4 — Avançado**
- `VidentePage` — diagnóstico em 3 tempos (do vidente.js)
- `MemoryPage` — visualização de memórias do Supabase
- `GovernancePage` — aprovações de agentes (do governance.js)

**Dia 5 — Terminal + KnowledgePage + Deploy**
- `TerminalPage` — terminal web com auto-healing
- `KnowledgePage` — navegação na KB (7 domínios)
- Deploy: Vercel (apps/web) + atualizar apps/api no Render

---

### 🔌 FASE 3 — INTEGRAÇÕES NOVAS (20h)

**3.1 WhatsApp persistente**
- Migrar de `useMultiFileAuthState` (arquivo local) para `useRedisAuthState` (Upstash)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` no .env
- Bot WhatsApp funciona 24/7 no Render sem cair

**3.2 MySQL no Render**
- No painel Hostinger → MySQL → Acesso Remoto → adicionar IP do Render
- Módulo financeiro funcionará na nuvem

**3.3 MCP Integration**
```js
// mcpService.js — novo serviço
// Conecta: brave-search, filesystem, github, postgres
// Rota: GET /api/mcp/tools, POST /api/mcp/invoke
```

**3.4 SSE Resumível**
```js
// sessionService.js — novo serviço
// Cada chat tem sessionId
// Cliente reconecta sem perder chunks
```

**3.5 RAG (Busca Vetorial)**
- Adicionar busca vetorial no Supabase (pgvector)
- Embeddings das mensagens e KB
- Respostas contextualizadas com histórico real

---

### 🌾 FASE 4 — AGROMACRO REACT V2 (15h)

Evoluir `GESTAO-DA-FAZENDA-ANTARES` para produção:

**4.1 Persistência Real**
- Substituir estado local por Supabase (tabelas: lotes, insumos, manejos, financeiro)
- Manter fallback localStorage para modo offline

**4.2 Integração com QG Nexus**
- `ChatInterface.tsx` já tem Gemini direto → migrar para chamar `/api/nexus/stream`
- O Nexus tem contexto agro no KB — respostas muito melhores que Gemini puro

**4.3 Mapa Real de Pastos**
- `InteractiveMap.tsx` já usa Leaflet
- Adicionar polígonos de pastos com coordenadas reais
- KPIs por pasto no mapa

**4.4 PWA + Offline**
- Adicionar `vite-plugin-pwa`
- Service Worker para offline-first
- Sync automático quando voltar online

---

### 💰 FASE 5 — NEGÓCIO (quando tiver tempo)

**5.1 Histórico de Negociações (GADO)**
- Módulo de registro de compra/venda de gado para terceiros
- Emissão de GTA digital
- CRM básico de clientes (ALOISIO, etc.)
- Integração com AgroMacro (seus próprios animais)

**5.2 Nexus como Produto (SaaS)**
- Empacotar QG Nexus como plataforma white-label
- Plano Básico (1 IA), Pro (cascata), Enterprise (WhatsApp + auto-pesquisa)
- Potencial: R$500-2000/mês com poucos clientes

**5.3 Voz via WhatsApp**
- Priscila manda áudio → Groq transcreve (Whisper) → Nexus processa → responde
- Ideal para uso no campo (mãos ocupadas)

---

## PROBLEMAS CONHECIDOS E SOLUÇÕES

| Problema | Causa | Solução |
|----------|-------|---------|
| WhatsApp cai no Render | auth_info_baileys efêmero | Upstash Redis sessionService |
| MySQL bloqueado no Render | Hostinger bloqueia IPs externos | Liberar IP Render no painel Hostinger |
| Chaves expostas .txt | Arquivo solto no Desktop | Rotar + deletar HOJE |
| server.js 681 linhas | Cresceu sem refactor | 12 route files (Fase 1) |
| dashboard.html 56KB | Frontend monolítico | React v2 (Fase 2) |
| CORS hardcoded | Domains fixos | Variável ALLOWED_ORIGINS |
| Rate limiter em memória | Não funciona multi-instância | Redis após Upstash |
| /config.js expõe chaves | Servido localmente | Remover na Fase 2 |
| Backup incompleto | Google Drive interrompido | Retomar backup HOJE |
| AgroMacro sem persistência real | Usa localStorage | Supabase (Fase 4) |
| Sem histórico de chat | Nunca implementado | tabela chat_history Supabase |

---

## ARQUIVOS SOLTOS — O QUE FAZER COM CADA UM

| Arquivo | O que é | Destino |
|---------|---------|---------|
| `explorer.js` | Agente de pesquisa de IAs — frontend JS | Reescrever como `ExplorerPage.tsx` no React |
| `vidente.js` | Diagnóstico do sistema em 3 tempos | Reescrever como `VidentePage.tsx` no React |
| `governance.js` | UI de aprovações de agentes | Reescrever como `GovernancePage.tsx` no React |
| `auto_evolve.js` | Runner manual do ResearchService | Mover para `scripts/auto_evolve.js` |
| `skills_data.js` | Pack de skills (8MB) | Mover para `src/skills/skills_data.js` |
| `list_gemini_models.js` | Utilitário de modelos | Mover para `scripts/` |
| `server_HOSTINGER.js` | Versão antiga OBSOLETA | Deletar |
| `server_hostinger_entry.js` | Versão antiga OBSOLETA | Deletar |
| `index_HOSTINGER.html` | Frontend antigo OBSOLETO | Deletar |

---

## CHECKLIST DE PRIORIDADES

### Hoje (obrigatório):
- [ ] Rotar todas as chaves de API nos painéis
- [ ] Atualizar .env com novas chaves
- [ ] Deletar arquivo .txt do Desktop
- [ ] Iniciar backup Google Drive

### Esta semana:
- [ ] Criar GitHub para AgroMacro React (GESTAO-DA-FAZENDA-ANTARES)
- [ ] Concluir backup Google Drive
- [ ] Limpar Desktop\QG-IA-NOVO\

### Próximas 2 semanas:
- [ ] Fase 0: Criar monorepo (package.json raiz + workspaces)
- [ ] Fase 1: Quebrar server.js em 12 route files
- [ ] Início da Fase 2: AppShell + LoginPage + ChatPage

### Próximo mês:
- [ ] Completar Fase 2 (React MVP completo)
- [ ] Fase 3: WhatsApp persistente + MySQL Render + MCP
- [ ] Fase 4: AgroMacro React com Supabase

---

## RESUMO EXECUTIVO

**O QG IA Nexus tem uma base técnica excepcional:**
- 20 serviços validados em produção
- 6 IAs em cascata com failover automático
- Auto-healing no terminal
- Pesquisa autônoma a cada 6h que avisa no WhatsApp
- Agent SDK integrado
- Knowledge base com 7 domínios de engenharia

**O que falta é profissionalizar a superfície:**
- Frontend React para substituir o dashboard.html monolítico
- Monorepo para organizar os projetos
- WhatsApp persistente para o bot não cair
- MCP para conectar ferramentas externas
- AgroMacro React com Supabase para uso real no campo

**O negócio real (GADO) merece um módulo no AgroMacro:**
A Priscila tem GTAs, clientes, fluxo de caixa de gado — dados que hoje ficam em PDFs e planilhas avulsas. Integrar isso no AgroMacro seria transformador.

**Linha do tempo realista:**
- Semana 1: Segurança + Organização (hoje já começa)
- Semanas 2-3: Monorepo + Backend refactor
- Semanas 4-7: React MVP completo
- Semanas 8-10: Integrações (WhatsApp Redis, MySQL, MCP)
- Semanas 11-14: AgroMacro React com Supabase
- Mês 4+: Módulo de negócio (GADO) + SaaS

---

*Análise realizada em: 2026-03-23*
*Arquivos lidos: 100+*
*Testes rodados: npm test (All tests passed)*
*Diretórios varridos: 17*
