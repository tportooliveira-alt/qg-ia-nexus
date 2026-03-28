# 🔍 DIAGNÓSTICO COMPLETO — QG-IA-Nexus
**Data**: 28/03/2026 | **Versão**: Post-Deploy VPS  
**Status Geral**: ⚠️ Operacional com falhas críticas

---

## ✅ O QUE FOI FEITO NESTA SESSÃO

### 1. Segurança (Token)
- ✅ Token inseguro substituído por **256-bit crypto hex**
- ✅ `.env` local e `.env-servidor` sincronizados
- ✅ `.gitignore` atualizado (`.env-servidor` e `tmp_*.js` protegidos)

### 2. VPS Control Panel
- ✅ `vpsService.js` — Coleta métricas via SSH (CPU, RAM, Disco, PM2, Nginx, Logs)
- ✅ `vps.routes.js` — 9 endpoints protegidos com auth + rate limiting
- ✅ `VPSPage.tsx` — Painel premium com gauges circulares
- ✅ Rota `/vps` integrada no `App.tsx` e sidebar `AppShell.tsx`

### 3. Deploy
- ✅ Git push com commit limpo
- ✅ Git pull na VPS + npm install + build + PM2 restart
- ✅ Build copiado para `/var/www/qgia/` (onde Nginx serve)
- ✅ VPS Panel funcionando em produção (verificado via browser)

---

## ❌ PROBLEMAS ENCONTRADOS NOS TESTES

### 🔴 CRÍTICOS (Bloqueiam uso)

| # | Problema | Onde | Impacto |
|---|---------|------|---------|
| 1 | **VPS Panel mostra "Conexão SSH Falhou"** quando VOCÊ acessa | VPS .env | O `.env` da VPS não tem `VPS_SSH_HOST`, `VPS_SSH_PASSWORD` — ele tenta SSH nele mesmo e falha |
| 2 | **Token antigo no browser** | Seu navegador | LocalStorage guarda token velho. Precisa logout + login com novo token |
| 3 | **`/api/knowledge/summary` retorna 404** | `knowledge.routes.js` | A rota `/knowledge/summary` não existe ou está com path errado no backend |
| 4 | **`/api/nexus/agents/status` retorna HTML em vez de JSON** | `agent.routes.js` | A rota não existe no backend. O Nginx devolve o `index.html` do React |

### 🟡 IMPORTANTES (Sistema funciona mas incompleto)

| # | Problema | Onde | Impacto |
|---|---------|------|---------|
| 5 | **MCP Servers = []** (vazio) | `mcpService.js` | Nenhum servidor MCP registrado. Agentes não têm ferramentas reais |
| 6 | **Conhecimento é "genérico"** | `autoCapacitationService.js` | Os 53 conhecimentos são resumos superficiais da internet (Groq). Não há aprendizado real sobre SEUS projetos |
| 7 | **Pesquisa duplica conteúdo** | `evolutionService.js` | Vários conhecimentos idênticos com timestamps diferentes (ex: "React Server Components" 3x) |
| 8 | **Audit mostra `nexus_comando - erro`** | `auditService.js` | Os últimos comandos do chat falharam. Não logga O QUE falhou |
| 9 | **Inline styles CSS** | `AppShell.tsx` | 22 warnings de lint. Styles devem ir para CSS externo |

### 🟠 ESTRUTURAIS (A raiz dos problemas)

| # | Problema | Impacto |
|---|---------|---------|
| 10 | **Agentes são "vazios"** — cada agente é apenas um system prompt + chamarIA | Não executam ações reais (não criam arquivos, não acessam APIs, não salvam resultados) |
| 11 | **Sem Plugin real** — `pluginManager.js` só tem 1 plugin (fabricaIA) e ele é decorativo | Agentes não podem instalar/usar ferramentas |
| 12 | **Knowledge Base estática** — Carrega JSONs/MDs de uma pasta, sem vetores, sem busca semântica | Busca é apenas `string.includes()`, não entende contexto |
| 13 | **Sem memória de conversa persistente** — `memoryService.js` é in-memory, perde tudo no restart | O sistema "esquece" a cada PM2 restart |
| 14 | **Sem execução de código** — o Coder agent gera código mas não executa, não testa, não deploya | Fábrica gera JSON bonito mas não produz app funcional |

---

## 🗺️ PLANO DE MELHORIAS (Próximas Etapas)

### 📌 FASE 1: Estabilização (1-2 dias)
> Consertar o que já existe para funcionar 100%

- [ ] **Fix VPS SSH**: Adicionar `VPS_SSH_HOST=localhost` e `VPS_SSH_PASSWORD` no `.env` da VPS
- [ ] **Fix Knowledge route**: Corrigir 404 em `/api/knowledge/summary`
- [ ] **Fix Agents route**: Criar `/api/nexus/agents/status` real
- [ ] **Fix duplicatas**: Deduplicar conhecimentos no `evolutionService`
- [ ] **Fix CSS**: Mover inline styles do `AppShell.tsx` para `.css`
- [ ] **Fix Audit**: Logar detalhes do erro, não só "erro"

### 📌 FASE 2: Aprendizado Real (3-5 dias)
> Fazer os agentes REALMENTE aprenderem

- [ ] **Memória persistente no Supabase** — Salvar conversas, decisões, e contexto de projetos
- [ ] **Knowledge com embeddings** — Usar Supabase `pgvector` para busca semântica real
- [ ] **Aprendizado por projeto** — Agentes devem entender o contexto de CADA projeto (FrigoGest, BoiTech, Vista Verde)
- [ ] **Feedback loop** — Se o usuário corrige um agente, ele deve lembrar da correção
- [ ] **Auto-avaliação** — Agentes avaliam a qualidade das próprias respostas antes de entregar

### 📌 FASE 3: Ferramentas Reais (5-7 dias)
> Dar PODER de execução aos agentes

- [ ] **MCP Servers ativos** — Conectar filesystem, git, Supabase MCP
- [ ] **Execução de código sandboxed** — Coder agent executa Node.js em container isolado
- [ ] **Deploy automatizado** — DeployAgent faz git push + build + deploy real na VPS
- [ ] **File system access** — Agentes criam/editam arquivos reais do projeto
- [ ] **Terminal execution** — Agentes executam comandos com approval gates

### 📌 FASE 4: Organização (Paralelo)
> Estruturar para escalar

- [ ] **Plugin system real** — Cada ferramenta é um plugin com install/config/use
- [ ] **Agent registry** — Dashboard mostra skills, status e histórico de cada agente
- [ ] **Pipeline tracking** — Ver cada etapa da Fábrica com status em tempo real
- [ ] **Error recovery** — Se um agente falha, outro assume (fallback chain)
- [ ] **Rate/cost tracking** — Monitorar gastos de tokens por agente/pipeline

---

## 📊 SCORE ATUAL DO SISTEMA

| Área | Score | Nota |
|------|-------|------|
| **Infraestrutura** | 7/10 | VPS + PM2 + Nginx OK. SSH precisa fix |
| **Segurança** | 8/10 | Token forte, rate limiting, auth middleware |
| **Frontend** | 7/10 | Visual premium, mas inline styles e UX incompleta |
| **Chat/IA** | 5/10 | Responde mas sem memória e sem ferramentas |
| **Aprendizado** | 2/10 | Salva resumos genéricos, não aprende de verdade |
| **Ferramentas** | 1/10 | MCP vazio, nenhuma tool conectada |
| **Organização** | 3/10 | Código funciona mas sem estrutura clara |
| **Entrega** | 2/10 | Fábrica gera specs mas não produz código executável |

**Score Geral: 4.4/10** — O sistema EXISTE e é bonito, mas os agentes são "atores" que fingem trabalhar. Precisam de ferramentas reais e memória real.

---

## 🔑 CREDENCIAIS ATUAIS

| Item | Valor |
|------|-------|
| **VPS IP** | `187.77.252.91` |
| **SSH** | `root` / `@8Vpb1mLy,jp/,g'/@Ej` |
| **Token Auth** | `f7e26b3e60d7f27023197d2358280545c8313b11327d62af4d96c895de1768d9` |
| **Nginx root** | `/var/www/qgia/` |
| **App dir** | `/root/qg-ia-nexus/` |
| **Frontend build** | `apps/web/dist/` → copiado para `/var/www/qgia/` |

---

## ⚡ COMANDO RÁPIDO PARA DEPLOY

```bash
# Na VPS (via Terminal Hostinger):
cd /root/qg-ia-nexus && git pull origin main && npm install && cd apps/web && npx tsc -b && npx vite build && cp -r dist/* /var/www/qgia/ && cd /root/qg-ia-nexus && pm2 restart 0 --update-env
```

---

> **Resumo**: O painel VPS está no ar, a segurança foi reforçada, mas os agentes ainda não têm ferramentas reais nem aprendem de verdade. A FASE 2 (aprendizado real) e a FASE 3 (ferramentas) são onde o verdadeiro poder vai surgir.
