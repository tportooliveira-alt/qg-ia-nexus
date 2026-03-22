# 🏭 FÁBRICA DE IA — Knowledge Base do Nexus

## O que é a Fábrica de IA

A **Fábrica de IA** (fabrica-ia-api) é um sistema multi-agente que transforma uma ideia descrita em texto em um **aplicativo completo** com código funcional. É um produto separado do QG IA Nexus, mas totalmente integrado a ele via plugin.

Frontend da Fábrica: https://ideiatoapp.me
Backend (API): https://fabrica-ia-api.onrender.com

---

## Pipeline da Fábrica (v4 — MasterOrchestrator)

O pipeline executa os seguintes agentes em sequência e paralelo:

1. **Analista** (Groq) — Extrai especificação estruturada da ideia
2. **Comandante** (Anthropic/Claude) — Define estratégia: nome, tipo, stack, complexidade
3. **Paralelo**: Arquiteto (Gemini) + Designer Conceito (Gemini)
4. **Loop até 4 iterações**:
   - CoderChief → spawna sub-agentes paralelos (SqlAgent, BackendAgent, FrontendAgent)
   - Designer → refina design system
   - Auditor (Claude) → avalia e pontua 0-100
   - Se score < 75: Corretor → corrige, loop repete
5. Entrega os artefatos: SQL, backend Node.js, frontend HTML/CSS/JS, design system

Comunicação com o cliente via **SSE (Server-Sent Events)** em tempo real.

---

## Como o Nexus usa a Fábrica

O Nexus detecta automaticamente quando o usuário quer criar um app e aciona a Fábrica.

### Palavras-chave que acionam a Fábrica:
- "criar app", "criar sistema", "criar aplicativo"
- "gerar projeto", "gerar app", "gerar sistema"
- "construir app", "construir sistema"
- "desenvolver app", "desenvolver sistema"
- "fábrica", "fabrica", "factory"
- "ideia para app", "transformar ideia em app"
- "quero um app", "quero um sistema", "preciso de um app"

### Fluxo quando o usuário pede um app:
1. Nexus detecta a intenção de criação de app
2. Nexus chama `FabricaPlugin.submeterIdeia(texto)` → API POST /api/pipeline/iniciar
3. Fábrica retorna um `pipelineId`
4. Nexus salva na memória (Supabase): `{ agente: 'NexusClaw', categoria: 'fabrica_pipeline', conteudo: pipelineId + ideia }`
5. Nexus informa o usuário com o ID e link para acompanhar

---

## Rotas disponíveis no Nexus para a Fábrica

Todas requerem `X-QG-Token` (JWT do Nexus). O Nexus comunica com a Fábrica internamente usando `X-Chave-Fabrica`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/fabrica/status | Verifica se a Fábrica está online |
| POST | /api/fabrica/orquestrar | Submete ideia → inicia pipeline → retorna pipelineId |
| GET | /api/fabrica/pipeline/:id/status | Consulta status do pipeline |
| GET | /api/fabrica/pipeline/:id/stream | Proxy SSE: transmite eventos do pipeline em tempo real |
| POST | /api/fabrica/pipeline/:id/cancelar | Cancela pipeline em execução |
| GET | /api/fabrica/projetos | Lista todos os projetos gerados |
| GET | /api/fabrica/projetos/:id | Detalha um projeto específico |

---

## Comandos WhatsApp

Quando conectado ao WhatsApp, o usuário pode enviar:

```
!fabrica criar app de gestão de estoque com cadastro de produtos e relatórios
```

O Nexus inicia o pipeline e responde com o ID + link de acompanhamento.

---

## Artefatos gerados pela Fábrica

Para um app `webapp/fullstack/dashboard`, a Fábrica gera:
- **SQL Schema** — tabelas, índices, relacionamentos
- **Backend Node.js** — rotas REST completas com Express
- **Frontend HTML/CSS/JS** — interface responsiva e funcional
- **Design System** — paleta, tipografia, componentes visuais

Para outros tipos:
- `api/script` → SQL + Backend
- `site` → Frontend only
- `planilha` → Especificação de planilha
- `documento` → Documento técnico

---

## Configuração necessária

No `.env` do QG IA Nexus:
```
FABRICA_API_URL=https://fabrica-ia-api.onrender.com
FABRICA_API_KEY=qgia-fabrica-2026
```

---

## Como o Nexus deve responder ao usuário após iniciar pipeline

Exemplo de resposta ideal:
```
🏭 FÁBRICA DE IA ACIONADA!

Ideia registrada: "app de gestão de estoque"
Pipeline ID: abc-123-xyz

O pipeline está rodando agora com 6 agentes especializados.
Acompanhe em tempo real no Dashboard → aba Fábrica de IA.

Quando concluído, os artefatos (SQL + Backend + Frontend) estarão disponíveis em:
→ GET /api/fabrica/projetos
```
