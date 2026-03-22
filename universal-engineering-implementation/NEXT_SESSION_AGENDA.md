# Pauta da Proxima Sessao (Execucao Final)

## Objetivo da sessao
Concluir a fase de produto "faz tudo" com integracoes MCP prioritarias, governanca de risco e plano de rollout em producao.

## Prioridades (ordem de execucao)
1. Fechar arquitetura MCP P0
- GitHub MCP
- Supabase MCP
- Sentry MCP
- Playwright MCP

2. Fechar arquitetura MCP P1
- Zapier MCP / Composio MCP (docs, planilhas, calendario, automacoes)
- Figma MCP (design-to-code)
- Notion MCP (knowledge ops)

3. Trilho 3D e multimidia
- Definir trilho Blender/Unity/CAD (PoC -> beta)
- Definir trilho Video (captura/transcricao/sintese)

4. Politica de seguranca MCP
- Allowlist de servidores oficiais
- Escopo minimo por credencial
- Rotacao de chave e revogacao rapida
- Auditoria por chamada de ferramenta

5. Gate de producao
- quality:gate em CI
- bloqueio de merge se benchmark < 90%
- bloqueio se erro de validacao > 0

## Entregaveis da sessao
- Matriz final MCP por area (owner, custo, risco, prazo)
- Plano de rollout por sprint (P0, P1, P2)
- Checklist de seguranca operacional
- Definicao de KPIs finais (latencia, acuracia, erro, custo)

## Definicao de pronto
- P0 MCP implementado e testado
- Guardrails ativos em todas as rotas criticas
- Trend de quality gate estavel
- Runbook de incidente publicado
