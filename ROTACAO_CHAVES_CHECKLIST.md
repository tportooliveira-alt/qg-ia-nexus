# Rotacao de Credenciais - QG IA

Data: 2026-03-19

## Status
- [x] QG_AUTH_TOKEN local regenerado e atualizado em `.env` e `.env.txt`.
- [ ] OpenAI API key rotacionada no painel OpenAI.
- [ ] Anthropic API key rotacionada no painel Anthropic.
- [ ] Groq API key rotacionada no painel Groq.
- [ ] Gemini API key rotacionada no Google AI Studio/Cloud.
- [ ] DeepSeek API key rotacionada no painel DeepSeek.
- [ ] Cerebras API key rotacionada no painel Cerebras.
- [ ] Supabase Service Role key rotacionada no projeto Supabase.
- [ ] MySQL senha alterada no provedor (Hostinger).
- [ ] WhatsApp master/credenciais revisadas.

## Pos-rotacao obrigatorio
- [ ] Atualizar `.env` com todas as novas chaves.
- [ ] Garantir `config.js` sem segredos (somente placeholders).
- [ ] Reiniciar backend.
- [ ] Validar login no dashboard e chamadas de API.
- [ ] Revogar/invalidar chaves antigas em todos os provedores.

## Observacao
A rotacao de provedores externos precisa ser feita nos paineis oficiais de cada servico.
