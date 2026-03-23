# MASTER PLAN — QG IA NEXUS ECOSYSTEM
**Único lugar. Toda a verdade. Versão: 2026-03-22**

> Este é o documento central. Tudo mais é detalhe. Quando estiver perdida, volte aqui.

---

## 🧠 A VISÃO EM UMA FRASE

**Construir o cérebro de IA pessoal mais completo do Brasil — um sistema onde cada app da Priscila está conectado ao QG IA Nexus como hub central, formando um ecossistema vivo que aprende, automatiza e decide junto com ela.**

---

## 🗺️ MAPA DO ECOSSISTEMA (como é HOJE)

```
                        ┌─────────────────────────────────────┐
                        │         QG-IA-NEXUS (HUB)           │
                        │   qg-ia-nexus.onrender.com           │
                        │                                      │
                        │  ┌──────────┐  ┌──────────────────┐ │
                        │  │ Cascade  │  │  Knowledge Base  │ │
                        │  │   IAs    │  │   (6 arquivos)   │ │
                        │  └──────────┘  └──────────────────┘ │
                        │                                      │
                        │  ┌──────────┐  ┌──────────────────┐ │
                        │  │ Memória  │  │  Agent SDK       │ │
                        │  │ Supabase │  │  (autônomo)      │ │
                        │  └──────────┘  └──────────────────┘ │
                        └─────────────┬───────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼───────┐   ┌──────────▼──────┐   ┌───────────▼──────┐
    │   WhatsApp      │   │   Fábrica de IA  │   │   Dashboard Web  │
    │   (Baileys)     │   │  (multi-agente)  │   │   (HTML/SSE)     │
    │   EM PRODUÇÃO   │   │  EM PRODUÇÃO     │   │  EM PRODUÇÃO     │
    └─────────────────┘   └─────────────────┘   └──────────────────┘

APPS SATÉLITE (ainda desconectados do hub — PRIORIDADE CONECTAR):

    ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐
    │   FRIGOGEST     │   │   AGROMACRO     │   │  GESTAO-ANTARES  │
    │  (React/TS)     │   │  (PWA vanilla)  │   │  (React/TS)      │
    │  EM PRODUÇÃO    │   │  FUNCIONAL      │   │  INCOMPLETO      │
    │  Firebase       │   │  v1 local       │   │  v0.0.0          │
    └─────────────────┘   └─────────────────┘   └──────────────────┘
```

---

## 📊 INVENTÁRIO COMPLETO DOS PROJETOS

### ✅ PRODUÇÃO ATIVA

| Projeto | Onde roda | Stack | GitHub | Estado real |
|---|---|---|---|---|
| **QG-IA-NEXUS** | Render.com | Node.js/Express/Supabase | ✅ | API rodando, chaves .env vazias LOCAL |
| **Fábrica de IA** | Render.com | Node.js multi-agente | ✅ | Pipeline Analista→Coder→Auditor |
| **FrigoGest** | Firebase | React 19/TS/Supabase | ✅ | v2.7.0, 16 agentes IA, 5 tiers |

### 🔧 FUNCIONAL MAS SEM PRODUÇÃO

| Projeto | Localização | Stack | Estado real |
|---|---|---|---|
| **AgroMacro** | tmp-repos/AgroMacro | PWA Vanilla JS | 27+ módulos, 100% offline, precisa de deploy |
| **IdeaOrganizer** | fabrica-ia-api/server | Node.js/Express | Nucleo funcional, features avançadas faltando |

### 🚧 INCOMPLETO / WIP

| Projeto | Localização | Stack | O que falta |
|---|---|---|---|
| **GESTAO-ANTARES** | tmp-repos/GESTAO-DA-FAZENDA-ANTARES | React 19/TS/Vite | Componentes não implementados, v0.0.0 |

### 🗑️ DUPLICATAS A ELIMINAR

| Projeto | Localização | Por que apagar |
|---|---|---|
| **QG-IA-NOVO** | Desktop/QG-IA-NOVO | Versão de 19/03, 3 dias mais antiga que o principal |
| **fabrica-ia-api (v2)** | tmp-repos/fabrica-ia-api | Versão 2.0.0, principal é 3.0.0 |
| **AgroMacro backup** | TUDO_PARA_BACKUP/Projetos/AgroMacro | Cópia de backup, versão principal em tmp-repos |
| **fazenda-cerebro backup** | TUDO_PARA_BACKUP/Projetos/fazenda-cerebro | Idem |

---

## 🎯 FASES DO PLANO — EM ORDEM OBRIGATÓRIA

### FASE 0 — SEGURANÇA (10 min) 🔴 FAZER PRIMEIRO
**Problema:** Chaves de API estão em arquivo .txt no Desktop. O .env do projeto tem `COLE_AQUI`.
**Ação:**
1. Abrir `Desktop/QG-IA-NOVO/GEMINI_API_KEY=AIzaSyD20IBqyZ4IlNSn.txt`
2. Copiar cada chave para `/c/Users/Priscila/qg-ia-nexus/.env`
3. Apagar o arquivo .txt
4. Confirmar que `.gitignore` tem `.env` — nunca commitar

**Resultado esperado:** O servidor local do QG-IA-NEXUS roda completamente, chat funciona.

---

### FASE 1 — CONSOLIDAR ESTRUTURA DO PC (1h)
**Problema:** Projetos em 6 lugares diferentes. Confusão total.
**Ação — criar estrutura única:**
```
C:\Users\Priscila\projetos\          ← NOVA PASTA RAIZ
├── qg-ia-nexus\                     ← já existe, mover se necessário
├── fabrica-ia-api\                  ← já existe em raiz, mover
├── frigogest-2026\                  ← já existe, mover
├── agromacro\                       ← mover de tmp-repos\AgroMacro\
├── gestao-fazenda-antares\          ← mover de tmp-repos\
└── idea-organizer\                  ← consolidar versão ativa
```
**Apagar:**
- `Desktop/QG-IA-NOVO/` (depois de copiar as chaves)
- `tmp-repos/fabrica-ia-api/` (versão 2.0.0 desatualizada)
- `TUDO_PARA_BACKUP/Projetos/` (backups antigos após confirmar que GitHub está atualizado)

---

### FASE 2 — FAZER O QG-IA-NEXUS RODAR LOCALMENTE (30 min)
**Pré-requisito:** Fase 0 completa (chaves no .env)
**Ação:**
```bash
cd /c/Users/Priscila/qg-ia-nexus
npm install
npm start
# Testar: POST /api/nexus/comando com prompt real
# Testar: GET /api/nexus/conhecimentos
# Testar: GET /api/fabrica/status
```
**Resultado esperado:** Chat com IA funcionando, cascata de provedores, memória Supabase.

---

### FASE 3 — CONECTAR OS APPS SATÉLITE AO HUB (2-4h por app)
**Visão:** Cada app deve ter um botão/função que fala com o QG-IA-NEXUS via API.
**Ordem:**
1. **AgroMacro** → Adicionar consultor IA via `/api/nexus/comando`
2. **FrigoGest** → Substituir chamadas diretas de IA pelo hub centralizado
3. **GESTAO-ANTARES** → Completar e conectar ao hub

**Padrão de integração:**
```javascript
// Mesma chamada em todos os apps satélite
async function consultarNexus(mensagem, contexto) {
  const res = await fetch('https://qg-ia-nexus.onrender.com/api/nexus/comando', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + QG_AUTH_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: mensagem, contexto })
  });
  return res.json();
}
```

---

### FASE 4 — DESIGN SYSTEM UNIFICADO (1 semana)
**Problema:** Cada app tem visual diferente. Sem identidade de marca.
**Ação:** Criar `qg-design-system` — repositório separado com:
- Paleta de cores oficial (dark mode first)
- Componentes React compartilhados
- Tipografia e espaçamento padrão
- Ícones SVG unificados
- Tokens CSS

**Resultado:** FrigoGest, AgroMacro e GESTAO-ANTARES usando os mesmos componentes visuais.

---

### FASE 5 — DEPLOY E PRODUÇÃO DOS SATÉLITES
1. **AgroMacro** → Deploy em Vercel (PWA, zero backend)
2. **GESTAO-ANTARES** → Deploy em Vercel (quando completo)
3. **IdeaOrganizer** → Deploy em Render (backend) + Vercel (frontend)

---

### FASE 6 — BACKUP COMPLETO GOOGLE DRIVE
Retomar de onde parou em 22/03:
1. `.gemini` (20 GB faltando)
2. `qg-ia-nexus` completo
3. `fabrica-ia-api`
4. Todos os projetos da nova estrutura

---

## 🏗️ ARQUITETURA ALVO (como DEVE ser)

```
┌──────────────────────────────────────────────────────────────────┐
│                    QG-IA-NEXUS (CÉREBRO CENTRAL)                 │
│                                                                  │
│  ENTRADA:  WhatsApp │ Web │ API direta │ Apps satélite           │
│                                                                  │
│  NÚCLEO:   Roteamento por domínio → Cascata de IAs              │
│            Memória Supabase ← → Knowledge Base                  │
│            Agente autônomo (Claude SDK)                          │
│            Fábrica de IA (gera apps)                             │
│                                                                  │
│  SAÍDA:    Resposta texto │ SSE streaming │ Ações autônomas      │
└────────────────────────────┬─────────────────────────────────────┘
                             │ API REST + SSE
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼────┐  ┌──────▼──────┐  ┌───▼──────────┐
    │  FRIGOGEST   │  │  AGROMACRO  │  │ GESTAO-FAZENDA│
    │              │  │             │  │               │
    │ 16 agentes   │  │ 27 módulos  │  │ Gestão Antares│
    │ 5 tiers IA   │  │ PWA offline │  │ React/TS      │
    │ React/TS     │  │ Consultor IA│  │               │
    └──────────────┘  └─────────────┘  └───────────────┘
              │              │              │
              └──────────────┴──────────────┘
                    TODOS FALAM COM O HUB
```

---

## 📋 DECISÕES TÉCNICAS DEFINITIVAS

| Decisão | Escolha | Por quê |
|---|---|---|
| **Backend de todos os apps** | Node.js + Express | Já dominado, ecossistema estabelecido |
| **Banco de dados** | Supabase | Já configurado, funciona em todos os projetos |
| **Frontend web** | React 19 + TypeScript | FrigoGest já usa, padrão do mercado |
| **Frontend mobile** | React Native (futuro) | Mesma base de conhecimento |
| **PWA offline** | Vanilla JS (AgroMacro) | Funciona, não precisa de build |
| **IA principal** | Claude (Anthropic) | Melhor raciocínio, Agent SDK nativo |
| **Cascade fallback** | Gemini → DeepSeek → Groq → Cerebras | Custo × velocidade × qualidade |
| **Deploy backends** | Render.com | Já configurado e funcionando |
| **Deploy frontends** | Firebase (FrigoGest) + Vercel (outros) | Já configurado |
| **CSS** | Tailwind CSS | FrigoGest já usa, produtividade alta |
| **Design** | Dark mode first | Todos os apps usam dark |

---

## 🚨 OS 3 PROBLEMAS MAIS URGENTES AGORA

1. **🔴 Chaves de API no arquivo .txt do Desktop** — risco de segurança, projeto não roda local
2. **🟠 QG-IA-NEXUS não roda localmente** — por causa das chaves, não tem como testar mudanças
3. **🟡 Apps satélite desconectados do hub** — cada app chama IA separado, sem memória compartilhada

**Resolver os 3 = o ecossistema começa a funcionar como sistema, não como projetos soltos.**

---

## ✅ O QUE JÁ ESTÁ FUNCIONANDO (não mexer)

- QG-IA-NEXUS em produção no Render — **NÃO MEXER sem testar local antes**
- FrigoGest em produção no Firebase — **NÃO MEXER sem branch de feature**
- Fábrica de IA em produção — **NÃO MEXER sem testar pipeline completo**
- Supabase com dados reais de memória e conhecimento
- GitHub com todos os repos principais

---

*Documento criado em 2026-03-22. Atualizar sempre que uma fase for concluída.*
