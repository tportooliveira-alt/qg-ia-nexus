# 📊 ESTADO DO PROJETO — QG IA Nexus

> Última auditoria: 2026-03-28 | Responsável: Thiago

---

## 🏗️ INFRAESTRUTURA

| Item | Valor |
|------|-------|
| VPS | Hostinger — Ubuntu 24.04 |
| IP | 187.77.252.91 |
| Processo | PM2 — app `qgia` — porta **3005** |
| Domínio | ideiatoapp.me / fabrica-ia.com.br / 187.77.252.91 |
| Framework | Node.js / Express (monorepo Turborepo) |
| Frontend | React + Vite (`apps/web/`) → build em `apps/api/public/` |
| **Nginx** | **Proxy reverso — porta 80 → /api/ vai para porta 3005** |
| **Static files** | **Nginx serve de `/var/www/qgia/` (NÃO de `apps/api/public/`)** |

### ⚠️ Arquitetura importante: nginx + Express
```
Browser (porta 80)
    │
    ├── /api/*   → nginx proxy_pass → Express (porta 3005)
    └── /*       → nginx serve static de /var/www/qgia/
                       └── try_files → fallback para /index.html (React SPA)
```

**Ao fazer build do React e querer ver no browser:**
```bash
cd /root/qg-ia-nexus
git pull origin main
cp -r apps/api/public/* /var/www/qgia/
pm2 restart qgia
```

---

## 🗄️ BANCOS DE DADOS

### Supabase (PostgreSQL) — banco principal
- **Projeto:** `icodlxcrfgcfygdcjzzu`
- **URL:** https://supabase.com/dashboard/project/icodlxcrfgcfygdcjzzu
- **Tabelas criadas via migration:** ver `apps/api/SUPABASE_SETUP.sql`

### MySQL Hostinger — banco legado
- **Host:** `srv1197.hstgr.io` (IP: 193.203.175.60)
- **Banco:** `u679869985_qgia`
- **Acesso remoto de:** `187.77.252.91`
- **Configuração em:** `apps/api/.env` — variáveis `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`

**Tabelas encontradas:**

| Tabela | Registros | Conteúdo |
|--------|-----------|---------|
| `agent_memories` | 4 | Memórias da Fábrica de IA (NexusClaw) — pipelines iniciados |
| `audit_logs` | 13 | fabrica_orquestrar ok, KnowledgeService knowledge_query ok |
| `ideias_logs` | 0 | Vazio — tabela criada mas sem dados |
| `transacoes_financeiras` | 0 | Estrutura: id, tipo (RECEITA/DESPESA), valor decimal(10,2), descricao, data_registro |

> **Nota:** `transacoes_financeiras` existe no MySQL mas não tem rota/service correspondente encontrado no código atual. Pode ser herança do FrigoGest/AgroMacro ou funcionalidade futura.

---

## 🤖 AGENTES DE IA — FÁBRICA DE IA

Pipeline de 6 etapas:
1. **Analista** — analisa a ideia
2. **Comandante** — define estrutura
3. **Arquiteto** — desenha arquitetura técnica
4. **Designer** — cria UI/UX
5. **CoderChief** → spawn de sub-agentes paralelos
6. **Auditor** — score de qualidade (0–100)

**LLMs em cascata** (ordem de fallback):
1. Gemini → `429` quota esgotada
2. Groq ✅ ativo
3. Cerebras ✅ ativo
4. SambaNova ✅ ativo
5. DeepSeek → `402` sem créditos
6. Anthropic → `400` chave inválida (precisa atualizar)

**Endpoints da Fábrica:**
- `GET  /api/fabrica/status` → `{ status: "Online", fabricaAtiva: true, ... }`
- `POST /api/fabrica/pipeline/iniciar` → `{ pipelineId, stream_url }` (SSE)
- `GET  /api/fabrica/pipeline/:id/stream` → stream SSE de eventos
- `POST /api/fabrica/orquestrar` → endpoint síncrono (legado)

---

## 🔑 CHAVES DE API E SEGURANÇA

### ⚠️ AÇÕES URGENTES

| Item | Status | Ação necessária |
|------|--------|-----------------|
| GitHub PAT `ghp_BDODhX17...` | **EXPOSTO no histórico de chat** | Revogar em github.com/settings/tokens e gerar novo |
| Anthropic API Key | **400 inválida** | Atualizar no `.env` em `/root/qg-ia-nexus/apps/api/.env` |
| DeepSeek API Key | **402 sem créditos** | Recarregar créditos ou substituir |
| Gemini API Key | **429 quota** | Aguardar reset ou usar outra chave |

### Como atualizar chaves no VPS:
```bash
cd /root/qg-ia-nexus/apps/api
nano .env
# Atualizar as chaves necessárias
pm2 restart qgia
```

---

## 🔧 FIXES REALIZADOS (sessão 2026-03-28)

### 1. Substituição completa de "Priscila" → "Thiago"
Todos os arquivos de código ativo foram corrigidos:

| Arquivo | Ocorrências fixadas |
|---------|---------------------|
| `apps/api/src/knowledge_base/NEXUS_CORE_KNOWLEDGE.md` | 1 |
| `apps/api/src/knowledge_base/NEXUS_TECH_RADAR.md` | 3 |
| `apps/api/src/knowledge_base/NEXUS_MASTER_ROADMAP.md` | 4 |
| `apps/api/src/knowledge_base/NEXUS_AGENT_NETWORK.md` | 3 |
| `apps/api/src/knowledge_base/NEXUS_FINANCE_EXPERT.md` | 2 |
| `apps/api/src/services/nexusService.js` | 6 |
| `apps/api/src/services/approvalService.js` | 1 |
| `apps/api/src/routes/approval.routes.js` | 1 |
| `apps/api/src/services/whatsappService.js` | 3 |
| `apps/api/src/services/researchService.js` | 1 |
| `apps/api/src/skills/agentes/NexusClaw.json` | 4 |
| `apps/api/src/skills/agentes/VidaDigital.json` | 2 |

> **Nota:** Arquivos legados em `_CONSOLIDADO/`, `MASTER_PLAN.md`, `NEXUS_OPERATIONS_MANUAL.md` ainda podem ter referências antigas — esses são apenas documentação histórica e não afetam o funcionamento.

### 2. Bug crítico FabricaPage.tsx — status sempre "Conectando..."
- **Causa:** Tipo TypeScript errado `{ fabrica: { status: string } }` mas API retorna `{ status: string; fabricaAtiva: boolean }` diretamente
- **Fix:** Corrigido tipo e todas as 3 referências ao status (linhas 139, 235, 246, 247)
- **Commits:** `1368f04` → `cbc4361` → `6aa69d6` (3 iterações até build limpo)

### 3. Bug endpoint errado na Fábrica
- **Causa:** FabricaPage usava `/fabrica/orquestrar` (síncrono) em vez de `/fabrica/pipeline/iniciar` (SSE assíncrono)
- **Fix:** Trocado para o endpoint correto que retorna `pipelineId` + stream SSE
- **Commit:** `1368f04`

---

## 📦 COMMITS DESTA SESSÃO

```
6aa69d6 fix: corrige última referência TS status.fabrica no style da FabricaPage
0f36df8 fix: substitui 'Priscila' por 'Thiago' em todos os arquivos de código ativo
cbc4361 fix: remove todas as referências TS a status.fabrica (erro de build)
1368f04 fix: corrige status da Fábrica de IA sempre preso em 'Conectando...'
8751f8d fix: substitui todas as referências 'Priscila' por 'Thiago' na knowledge base
```

---

## ⏳ PENDÊNCIAS

### 🔴 Crítico
1. **Revogar GitHub PAT exposto** — ir em https://github.com/settings/tokens e revogar o token `ghp_BDOD...` (token foi exposto em sessão anterior — REVOGAR IMEDIATAMENTE e gerar novo)
2. **Atualizar Anthropic API Key** — atual retorna 400
3. **VPS: git pull + pm2 restart** — rodar no terminal do Hostinger quando token renovar:
   ```bash
   cd /root/qg-ia-nexus && git pull origin main && pm2 restart qgia
   ```

### 🟡 Importante
4. **Supabase SQL** — executar `apps/api/SUPABASE_SETUP.sql` no dashboard do Supabase para criar tabelas completas
5. **Investigar transacoes_financeiras** — tabela existe no MySQL mas sem rota/service no código atual
6. **Recarregar créditos DeepSeek** — ou substituir pela chave nova

### 🟢 Quando tiver tempo
7. Testar pipeline E2E completo da Fábrica de IA com ideia real
8. Verificar se `ideias_logs` está sendo populado durante pipelines
9. Limpar documentação legada em `_CONSOLIDADO/` que ainda tem referências antigas

---

## 🗂️ ESTRUTURA DO PROJETO

```
qg-ia-nexus/
├── apps/
│   ├── api/          # Node.js/Express — porta 3005
│   │   ├── src/
│   │   │   ├── routes/        # Express routes
│   │   │   ├── services/      # Lógica de negócio
│   │   │   ├── skills/agentes/ # Definições dos agentes JSON
│   │   │   └── knowledge_base/ # Base de conhecimento do Nexus
│   │   └── public/   # Build do React (copiado de apps/web/dist)
│   └── web/          # React + Vite SPA
│       └── src/pages/FabricaPage.tsx  # UI da Fábrica de IA
├── turbo.json         # Turborepo monorepo config
└── ESTADO_DO_PROJETO.md  # Este arquivo
```

---

## 🔄 COMO REBUILDAR O FRONTEND

Após mudanças no `apps/web/`:
```bash
cd /root/qg-ia-nexus/apps/web
npm install --legacy-peer-deps
npm run build
cp -r dist/* ../api/public/
pm2 restart qgia
```
