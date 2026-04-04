# 🏭 Fábrica de IA — Lições Aprendidas (sessão 2026-04-03)

## CRÍTICO: Tokens dos Agentes

Todos os agentes da Fábrica precisam de tokens ≥ 8000. Valores baixos causam:
- JSON truncado → parse error → fallback sem IA → score 10/100
- Commander com campos `undefined`
- Auditor usando só validação sintática → score trava

**Arquivos corrigidos:**
- `src/fabrica/agents/commander.js` → 8000
- `src/fabrica/agents/architect.js` → 8000
- `src/fabrica/agents/auditor.js` → 8000
- `src/fabrica/agents/fixer.js` → 8000
- `src/fabrica/agents/coder.js` → 8000
- `src/fabrica/agents/designer.js` → 8000
- Todos os sub-agentes → 8000

**Regra:** NUNCA usar valores < 4000 nos agents da Fábrica. Preferir 8000.

---

## CRÍTICO: SYSTEM_PROMPT em inglês no Commander

Commander com prompt em inglês faz o LLM retornar campos como `project_type` em vez de `tipo_projeto`.
O MasterOrchestrator espera campos em português. Resultado: `Plano: "undefined"`.

**Solução:** SYSTEM_PROMPT sempre em português com schema JSON explícito mostrando os campos exatos esperados.

---

## VPS Hostinger — Configuração

- IP: `187.77.252.91`
- Projeto: `/root/qg-ia-nexus/`
- PM2: `nexus-api` (processo 0)
- Senha root: rotacionada em 2026-04-03
- Após mudar `.env`: `pm2 restart nexus-api --update-env`

---

## Chaves de API — Status (2026-04-03)

| Provedor | Status | Observação |
|---------|--------|-----------|
| Anthropic | ✅ Ativa | Principal provedor funcionando |
| Gemini | ⚠️ 429 | Rate limit / chave errada |
| Groq | ❌ 401 | Chave expirada |
| Cerebras | ❌ 401 | Chave expirada |
| DeepSeek | ❌ 401 | Chave expirada |

**Ação necessária:** Renovar chaves Groq, Cerebras e DeepSeek.

---

## Evolução do Score Fábrica

| Momento | Score | Problemas | Causa |
|---------|-------|-----------|-------|
| Início | 10/100 | 15 | Tokens baixos, JSON truncado em todos os agentes |
| Após fix tokens Commander | 20/100 | 4 | Auditor ainda truncando |
| Após fix Auditor (8000) | A aguardar | — | Todos os agentes com 8000 tokens |

---

## Cascata de IAs — Ordem Recomendada (com chaves válidas)

Padrão: `Groq → DeepSeek → Cerebras → Anthropic → OpenAI → Gemini`
Código: `DeepSeek → Groq → Cerebras → Anthropic → OpenAI → Gemini`
Análise: `DeepSeek → Anthropic → Groq → Cerebras → OpenAI → Gemini`

Gemini vai sempre por último (chave problemática).
