# Continuação do Projeto (2026-04-01)

Este arquivo resume exatamente onde paramos, para retomar rápido.

## Últimos commits já no GitHub

- `fc56aac` - Harden orchestrator loop and plan normalization
- `ea6d3a5` - fix(fabrica): keep pipeline running when fixer fails with malformed JSON
- `a55cc4d` - fix(fabrica): restore architect agent and add resilient fallbacks for analyst/commander
- `def28fb` - chore(ops): add assist diag-local command for localhost diagnostic
- `eafb2dd` - fix(api): enforce localhost diagnostic check behind nginx headers
- `51abc46` - feat(api): add localhost-only diagnostic endpoint without token
- `68c58e4` - fix(ops): make assist agentes-test resilient to output truncation
- `18a0850` - chore(ops): add assist terminal routines for agents and health

## O que já está funcionando

- Pipeline não cai mais imediatamente quando o corretor falha JSON.
- Arquiteto foi restaurado (`architect.projetar`).
- Analista e Comandante têm fallback para manter fluxo.
- Endpoint de diagnóstico local está ativo:
  - `GET http://127.0.0.1:3005/api/internal/diagnostic`
- Scripts de suporte operacionais:
  - `./scripts/assist.sh health`
  - `./scripts/assist.sh diag-local`
  - `./scripts/assist.sh agentes-test`
  - `./scripts/assist.sh rotina`
  - `./scripts/assist.sh deploy`

## Bloqueios atuais (infra/credenciais)

No VPS, foi identificado:

- `CHAVE_SECRETA_DA_API=MISSING`
- `DB_PASSWORD=MISSING`
- `DB_PORT=MISSING`
- Algumas chaves de IA presentes, mas com erro de autenticação/quota (401/429) nos logs.

Impacto:

- Agentes rodam em modo degradado/fallback.
- Persistência MySQL falha por credencial incompleta.

## Próxima retomada (ordem recomendada)

1. Corrigir `.env` em `apps/api/.env` no VPS:
   - preencher `CHAVE_SECRETA_DA_API`
   - preencher `DB_PASSWORD`
   - preencher `DB_PORT` (normalmente `3306`)
2. Validar chaves IA (Groq, Cerebras, DeepSeek, OpenAI, Gemini) para eliminar `401/429`.
3. Reiniciar serviço:
   - `pm2 restart qgia`
4. Rodar verificação:
   - `./scripts/assist.sh health`
   - `./scripts/assist.sh diag-local`
   - `./scripts/assist.sh agentes-test`
5. Executar teste de pipeline longo até evento final (`pipeline_concluido` ou `pipeline_parcial`).

## Comando rápido de retomada

```bash
cd /root/qg-ia-nexus
git pull origin main
./scripts/assist.sh health
./scripts/assist.sh agentes-test
```

