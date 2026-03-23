# 09 — Projetos Satélite

## Visão do ecossistema

O QG IA Nexus é o hub central. Todos os outros projetos são satélites.
Cada satélite faz chamadas ao hub para usar a IA, a memória e os agentes.

```
QG IA Nexus (hub)
├── FrigoGest     → chama /api/nexus/stream para análises
├── AgroMacro     → chama /api/nexus/stream para consultoria agro
├── GESTAO-ANTARES → a definir
└── ideiatoapp.me  → chama /api/fabrica/orquestrar para gerar apps
```

---

## FrigoGest

**Caminho:** `C:\Users\Priscila\frigogest-2026\`
**Stack:** React/TypeScript + Firebase
**Versão:** v2.7.0
**Status:** ✅ Funcional | ⚠️ SEM GITHUB

### O que é
Gestão completa de frigorífico com 16 agentes IA em 5 tiers:
1. **Recepção** — entrada de animais, peso, rastreabilidade
2. **Inspeção** — RIISPOA, SIF, inspeção veterinária
3. **Abate** — linha de abate, rendimentos, perdas
4. **Processamento** — cortes, embalagem, rotulagem
5. **Expedição** — notas fiscais, rastreabilidade final, logística

### Documentos encontrados
- `DEEP_ANALYSIS_AUDIT.md` — análise profunda do sistema
- `PADRAO_ESTORNO_BLINDADO.md` — lógica de estorno à prova de erros
- `PLANO_MIGRACAO_SUPABASE.md` — migrando Firebase → Supabase

### Ação imediata
```bash
cd C:\Users\Priscila\frigogest-2026
gh repo create frigogest-2026 --private
git init && git add . && git commit -m "initial: FrigoGest v2.7.0"
git push -u origin main
```

### Conexão com o hub (Fase 4)
```typescript
import { NexusClient } from '@qg/nexus-client';
const nexus = new NexusClient({ url: process.env.NEXUS_URL, token: process.env.NEXUS_TOKEN });

// Análise de rendimentos
const analise = await nexus.streamMessage(
  "Analise os rendimentos do abate de hoje: entrada 1200kg, saída carcaça 650kg",
  { domain: "frigo" }
);
```

---

## AgroMacro

**Caminho:** `C:\Users\Priscila\tmp-repos\AgroMacro\`
**Stack:** PWA Vanilla JS
**Status:** 🟡 Funcional localmente | Sem deploy

### O que é
Super-app de gestão de fazenda. 27+ módulos, funciona 100% offline (Service Worker).

### Módulos confirmados
- Rebanho (cadastro, peso, rastreabilidade)
- Lotes (organização, movimentação)
- Pastos (área, capacidade, rotação)
- Financeiro (DRE, fluxo de caixa)
- KPIs (índices zootécnicos)
- IA Consultora (integração com hub)
- Rastreabilidade (SISBOV / e-Rastreabilidade)

### Diferencial
Funciona sem internet — essencial para fazendas em áreas rurais.
PWA com cache total (manifest.json + sw.js).

### Ação
```bash
# Verificar se tem GitHub:
cd C:\Users\Priscila\tmp-repos\AgroMacro
git remote -v

# Se não tiver:
gh repo create agromacro --private
git push -u origin main
```

### Conexão com o hub (Fase 4)
Como é Vanilla JS, o nexus-client precisa ser um script puro sem dependências:
```html
<script src="/nexus-client.js"></script>
<script>
const nexus = new NexusClient({ url: CONFIG.nexusUrl, token: localStorage.getItem('nexus_token') });
nexus.streamMessage("qual o GMD médio do lote 3 este mês?").then(resposta => {
  document.getElementById('ia-response').textContent = resposta;
});
</script>
```

---

## GESTAO-DA-FAZENDA-ANTARES

**Caminho:** `C:\Users\Priscila\tmp-repos\GESTAO-DA-FAZENDA-ANTARES\`
**Stack:** React/TypeScript + Vite
**Versão:** v0.0.0 (incompleto)
**Status:** 🔴 Apenas estrutura inicial

### O que tem
```
App.tsx, index.tsx, vite.config.ts, tsconfig.json
components/, services/, types.ts
```

### Decisão a tomar
Duas opções:
1. **Absorver no AgroMacro** — unificar gestão de fazenda em um app
2. **Evoluir separado** — criar app específico para Fazenda Antares com RBAC e perfis

Recomendação: Absorver. Dois apps de fazenda é energia dividida.

### Ação imediata
```bash
gh repo create gestao-fazenda-antares --private
git init && git add . && git commit -m "initial: estrutura base"
git push -u origin main
```

---

## IdeaOrganizer

**Caminho:** `C:\Users\Priscila\IdeaOrganizer\server\`
**Stack:** Node.js
**Status:** 🟡 Funcional, embutido no dashboard

### O que é
Organizador de ideias de projetos. Captura, categoriza e prioriza ideias.

### Decisão
Manter embutido no QG v2. O `ideia-capturada.md` na KB já serve como template.
Não vale criar app separado para isso.

---

## Fazenda Cérebro

**Caminho:** `C:\Users\Priscila\tmp-repos\fazenda-cerebro\` (se existir)
**Stack:** React Native (planejado)
**Status:** 🔴 Conceito — não confirmado localmente

### O que era o plano
- App mobile para gestão de fazenda
- Agentes paralelos
- Entrada por voz + foto + texto
- Integração com sensores de campo

### Decisão
Por ora, priorizar AgroMacro PWA que já funciona offline.
Fazenda Cérebro seria a versão nativa — Fase 5 (futuro distante).

---

## ideiatoapp.me (Frontend da Fábrica)

**URL:** https://ideiatoapp.me
**Stack:** HTML/CSS/JS estático
**Status:** ✅ Online
**Relação:** Frontend que chama `fabrica-ia-api.onrender.com`

### O que precisa
- Quando o QG v2 ficar pronto, ideiatoapp.me pode ser integrado ao frontend React
- Ou manter separado e se comunicar via API

---

## Resumo de ações por projeto

| Projeto | Ação urgente | Ação Fase 4 |
|---------|-------------|------------|
| FrigoGest | Criar GitHub | Integrar nexus-client |
| AgroMacro | Confirmar GitHub | Integrar nexus-client vanilla |
| GESTAO-ANTARES | Criar GitHub | Decidir absorver ou evoluir |
| IdeaOrganizer | — | Manter embutido no QG v2 |
| Fazenda Cérebro | — | Fase 5 (futuro) |
| ideiatoapp.me | — | Avaliar integração com web/ |
