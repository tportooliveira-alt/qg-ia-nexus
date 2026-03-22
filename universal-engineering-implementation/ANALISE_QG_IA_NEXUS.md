# Análise Detalhada — qg-ia-nexus

Data: 2026-03-21

Resumo executivo
- Projeto: plataforma NEXUS — rede de agentes/skills para geração e orquestração de tarefas com múltiplos provedores LLM.
- Principal: backend Node.js (serviços em `src/services`), frontend estático (`index.html`, `dashboard.html`), agentes declarados em JSON (`src/skills/agentes`).

Arquitetura e componentes centrais
- `src/services/aiService.js`: adaptadores por provedor (Gemini, DeepSeek, Anthropic, OpenAI, Groq, Cerebras). Fornece `chamarIAComCascata()` para roteamento e síntese.
- `src/services/agentRegistryService.js`: carrega agentes/skills do diretório `src/skills/agentes` (JSONs).
- Outros serviços relevantes: `auditService`, `memoryService`, `nexusService`, `evolutionService` — mostram um fluxo maduro de orquestração, auditoria e evolução de agentes.
- Agentes declarativos: `Analista.json`, `Arquiteto.json`, `GeminiCode.json`, etc. Cada JSON contém prompts, configurações e metadados.

Pontos fortes
- Design modular: separação entre adapters (`aiService`) e definição de agentes (JSON). Facilita adicionar novos provedores e skills.
- Existência de serviços de suporte (audit, memory, registry) já prontos para plug-in de orquestração avançada.
- `aiService` já implementa estratégias de fallback e modo síntese (parallel calls), com perfil de tokens.

Riscos e limitações detectadas
- Falta de roteamento dinâmico centralizado por tarefa/skill — `aiService` escolhe pela análise do prompt, mas faltam regras externas configuráveis (por provider, custo, SLA).
- Ausência de sandbox para execução de código gerado (risco de injeção/execução insegura).
- Persistência de memórias é simples (logs/learned_facts.json) — sem indexação vetorial para RAG (Pinecone, Weaviate, etc.).
- Observabilidade & métricas específicas de custo/latência por provider ainda são superficiais.

Oportunidades de melhoria (alto nível)
1. Implementar um arquivo/config de roteamento (`agentRouting.json`) para mapear tipos de tarefa → provider(s) preferenciais, com prioridades e failover.
2. Adicionar Vector DB para memórias (RAG) e indexação de `src/knowledge_base` — maior consistência e recuperação de contexto.
3. Criar sandbox de execução para validar e testar código gerado (container isolado, Firecracker/Kata) antes de aceitar/mesclar artefatos.
4. Expor métricas: contador de chamadas por provider, latência, custo estimado, iterações por projeto; integrar Prometheus/Grafana.
5. Converter agentes JSON em uma camada executável com contratos (input schema / output schema) e validações de contrato (JSON Schema).

Plano de implementação (por fases)
- Fase A (1-3 dias): adicionar `agentRouting.json`, pequenas mudanças em `aiService.chamarIAComCascata()` para respeitar roteamento externo; criar `docs/` com análise.
- Fase B (3-7 dias): integrar Vector DB (Pinecone/Weaviate), adaptar `memoryService` para armazenar embeddings; criar scripts de indexação da pasta `src/knowledge_base`.
- Fase C (5-10 dias): implementar sandbox de execução para código gerado e adicioná-lo ao pipeline de auditoria (`auditService` + `evolutionService`).
- Fase D (3-6 dias): observabilidade e CI/CD (GitHub Actions) para build/test/deploy, monitoramento e alertas.

Arquivos-chave a modificar
- `src/services/aiService.js` — adicionar hooks para routing e métricas.
- `src/services/agentRegistryService.js` — validar agentes (schema) ao registrar.
- `src/services/memoryService.js` — adaptar para Vector DB.
- `src/skills/agentes/*.json` — adicionar campos `taskType`, `inputSchema`, `preferredProviders`.
- `server.js` / pipeline endpoints — adicionar `/health`, `/metrics`, `/agents/status` se faltarem.

Verificação / critérios de sucesso
- Testes unitarios para roteamento e fallback (mocks providers).
- Execução de pipeline exemplo: do brief → analista → arquiteto → coder → auditor → fixer; resultado auditado e salvo.
- Métricas visíveis em dashboard (calls/provider, latência, iterações).

Pontos de pesquisa e aprendizagem (serão salvos em LEARNINGS_QG_IA_NEXUS.md)
- Contratos de agentes (como padronizar prompts e schemas).
- Boas práticas para sandbox de execução de código gerado.
- Estratégias de roteamento costeável entre provedores.

Próximos passos imediatos (exequíveis agora)
1. Criar `agentRouting.json` e adaptar `aiService.chamarIAComCascata()` para priorizar pelo routing.
2. Modelar JSON Schema para agentes e validar `agentRegistryService`.
3. Adicionar endpoint `/agents/list` que retorna agentes com metadados e provedor preferido.

--
Autor: análise automatizada com apoio humano