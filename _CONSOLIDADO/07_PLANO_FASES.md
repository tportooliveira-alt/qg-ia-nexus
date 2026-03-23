# 07 — Plano de Fases (o que fazer em que ordem)

## Antes de tudo — Segurança e PC (fazer HOJE)

### PC Cirurgia (ver 04_FRAGMENTOS_ENCONTRADOS.md para detalhes)

| # | Ação | Tempo |
|---|------|-------|
| 1 | Mover chaves do arquivo .txt para .env de cada projeto | 10 min |
| 2 | Deletar `Desktop\QG-IA-NOVO\GEMINI_API_KEY=*.txt` | 1 min |
| 3 | Criar GitHub para **frigogest-2026** | 10 min |
| 4 | Criar GitHub para **GESTAO-ANTARES** | 10 min |
| 5 | Verificar GitHub do AgroMacro | 5 min |
| 6 | Deletar duplicatas após confirmar GitHub | 20 min |

---

## FASE 0 — Monorepo (2h) ← PRIMEIRA

**Objetivo:** Reorganizar sem quebrar produção.

```
1. Criar package.json raiz com workspaces: ["apps/*", "packages/*"]
2. Criar apps/api/ e mover para lá:
   - server.js → apps/api/server.js
   - src/ → apps/api/src/
   - tests/ → apps/api/tests/
   - package.json → apps/api/package.json
3. Criar turbo.json
4. Mover scripts soltos: auto_evolve.js, list_gemini_models.js → scripts/
5. Mover arquivos obsoletos para lixo: server_HOSTINGER.js, index_HOSTINGER.html
6. Mover SQL: supabase_tabelas_faltando.sql → database/migrations/
7. Atualizar render.yaml: rootDir: apps/api
8. Testar: npm start em apps/api funciona
9. Commit + push
```

**Critério de sucesso:** `npm start` funciona, produção intacta, testes passam.

---

## FASE 1 — Backend Refactor (4h) ← SEGUNDA

**Objetivo:** Quebrar server.js em route files organizados.

```
1. Criar apps/api/src/routes/index.js
2. Criar 12 route files (extraindo do server.js sem mudar lógica):
   - nexus.routes.js (6 rotas)
   - agent.routes.js (2 rotas)
   - memory.routes.js (2 rotas)
   - fabrica.routes.js (9 rotas)
   - knowledge.routes.js (3 rotas)
   - approval.routes.js (3 rotas)
   - terminal.routes.js (1 rota)
   - fs.routes.js (2 rotas)
   - skills.routes.js (1 rota)
   - config.routes.js (1 rota)
   - status.routes.js (2 rotas)
   - mcp.routes.js (NOVO: 3 rotas)
3. Criar apps/api/src/bootstrap.js (lógica de inicialização)
4. Criar apps/api/src/utils/safeAudit.js
5. Novo server.js com ~50 linhas
6. Rodar npm test — todos passam
7. Commit + push
```

**Critério de sucesso:** Mesmo comportamento, zero mudança de lógica, testes passam.

---

## FASE 2 — Frontend React MVP (20h) ← TERCEIRA

**Objetivo:** Substituir dashboard.html por React app profissional.

```
Dia 1 (4h): Setup
1. npm create vite@latest apps/web -- --template react-ts
2. Instalar: tailwindcss, react-router-dom, zustand, @tanstack/react-query
3. Criar tokens.css com design system completo
4. Criar AppShell (header + sidebar + hamburger mobile)
5. Criar LoginPage com auth por token

Dia 2 (4h): Chat
6. Criar ChatPage com SSE streaming
7. Criar ProviderBadge (qual IA respondeu)
8. Criar DomainBadge (qual domínio detectado)
9. Criar StreamingDots (animação de typing)
10. Criar api/sse.ts com reconnect automático

Dia 3 (4h): Agentes
11. Criar AgentsPage com grid responsivo
12. Criar AgentCard com status badge
13. Criar AgentStatusBadge (online/busy/offline)
14. Conectar ao GET /api/agentes

Dia 4 (4h): Fábrica
15. Criar FabricaPage
16. Criar PipelineKanban (etapas em tempo real)
17. Criar IdeiaForm (submissão)
18. Conectar SSE do pipeline

Dia 5 (4h): Terminal + Deploy
19. Criar TerminalPage com histórico
20. Deploy no Vercel (ou Render static site)
21. Atualizar CORS no backend para incluir novo domínio
22. Smoke test completo
```

**Critério de sucesso:** Frontend React funciona em produção, substitui dashboard.html.

---

## FASE 3 — Features Novas (20h) ← QUARTA

**Objetivo:** Adicionar o que os concorrentes têm e o que é único nosso.

```
1. sessionService.js → SSE resumível
   + atualizar nexus.routes.js para usar session IDs
   + atualizar api/sse.ts para enviar/receber sessionId

2. ConversationBranch.tsx → fork de conversa
   + useChatStore: forkConversation(messageId)

3. MemoryDashboard.tsx → visualização de memória
   + GET /api/agent/memory → exibir em cards editáveis

4. mcpService.js → MCP client
   + instalar @modelcontextprotocol/sdk
   + registrar servidores: brave-search, filesystem, github
   + criar mcp.routes.js com list/invoke

5. MCPPanel.tsx → painel de MCP
   + listar servidores conectados + ferramentas disponíveis
   + invocar ferramentas diretamente

6. CostIndicator.tsx → custo por resposta
   + backend retorna tokens usados + custo estimado
   + exibir no rodapé de cada mensagem

7. WhatsApp Redis (Upstash)
   + instalar @upstash/redis
   + modificar whatsappService.js → useRedisAuthState
   + QR code via endpoint /api/whatsapp/qr (base64)
   + Exibir QR no MCPPage ou DashboardPage
```

**Critério de sucesso:** WhatsApp persiste no Render, MCP conectado, memória visível.

---

## FASE 4 — Satélites (após Fase 3)

**Objetivo:** Conectar FrigoGest e AgroMacro ao hub.

```
1. Criar packages/nexus-client/
   - SDK JavaScript para apps externos
   - Métodos: sendMessage(), streamMessage(), getAgents(), getMemory()
   - Autenticação via QG_AUTH_TOKEN

2. Integrar no FrigoGest (React/TS — fácil)
   - import { NexusClient } from '@qg/nexus-client'
   - const nexus = new NexusClient({ url, token })
   - nexus.streamMessage("analise o rebanho do mês")

3. Integrar no AgroMacro (PWA Vanilla — trabalhoso)
   - Criar nexus-client.js sem dependências
   - Integrar no módulo de IA do AgroMacro
```

---

## Cronograma resumido

| Fase | O que é | Horas |
|------|---------|-------|
| PC Cirurgia | Segurança + GitHub dos projetos | 1h |
| Fase 0 | Monorepo | 2h |
| Fase 1 | Backend refactor (route files) | 4h |
| Fase 2 | Frontend React MVP | 20h |
| Fase 3 | Features novas (MCP, branching, memória) | 20h |
| Fase 4 | Satélites (FrigoGest, AgroMacro) | 10h+ |
| **Total** | | **~57h** |

---

## Regra de ouro

> **Mover, não reescrever.**
> Os 20 serviços funcionam em produção.
> Cada arquivo movido deve passar nos testes antes de qualquer modificação.
> Primeiro mover. Depois melhorar.
