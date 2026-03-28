# 🎓 Nexus Self-Improvement Guide

## Princípio Fundamental
O Nexus Claw é um sistema de IA multi-agente projetado para EVOLUÇÃO CONTÍNUA.
Ele não é estático — a cada ciclo de pesquisa, auto-correção e capacitação,
o sistema se torna mais inteligente, mais capaz e mais autônomo.

## Ciclos de Evolução Autônoma

### 1. Pesquisa (a cada 6h)
- Varre 7 temas por ciclo (21 temas no pool, rotação completa em 3 ciclos)
- Fontes: arXiv, Semantic Scholar, Papers with Code, GitHub Trending
- Saída: Conhecimentos salvos no Supabase (agent_memories)

### 2. Auto-Correção (a cada 12h)
- Lê últimos erros do audit_log
- IA analisa padrões de falha
- Sugere e registra ações corretivas

### 3. Auto-Capacitação (a cada 4h)
- 7 módulos de capacitação com rotação
- MCP Tools Discovery — descobre novas ferramentas MCP
- Free LLM Providers — mapeia IAs gratuitas disponíveis
- Advanced Agent Patterns — aprende padrões de agentes state-of-the-art
- Developer Tools — descobre ferramentas de desenvolvimento modernas
- Automation APIs — mapeia APIs de automação (WhatsApp, email, pagamentos)
- Security Patterns — aprende melhores práticas de segurança
- Revenue Models — analisa modelos de monetização viáveis

## Como o Nexus Aprende

```
Ciclo de Aprendizado:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   PESQUISAR  │ ──► │   AVALIAR    │ ──► │  INTEGRAR    │
│  (Descobrir) │     │ (É útil?)    │     │ (Aplicar)    │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                                         │
       └─────────────── FEEDBACK ─────────────────┘
```

### Armazenamento de Conhecimento
- **Curto prazo**: `learned_facts.json` (arquivo local)
- **Longo prazo**: `agent_memories` no Supabase (persistente)
- **Auditoria**: `audit_logs` no Supabase (rastreabilidade)

## Capacidades Atuais (auto-atualizado)

### IAs Disponíveis (cascata de failover)
1. Gemini 2.5 Flash — Provider principal (gratuito)
2. Groq — Ultra-rápido, Llama 3.3 70B (gratuito)
3. Cerebras — Fallback rápido, Llama 3.1 8B (gratuito)
4. SambaNova — Llama 3.3 70B (gratuito)
5. Anthropic — Claude 3.5 Sonnet (pago)
6. OpenAI — GPT-4o (pago)
7. xAI — Grok 3 Mini (verificar crédito)
8. DeepSeek — DeepSeek Chat (sem crédito atual)

### Ferramentas Integradas
- Terminal com auto-healing
- MCP Client (JSON-RPC 2.0 via stdio)
- WhatsApp (Baileys)
- Supabase (PostgreSQL)
- Pipeline de Fábrica (7 agentes + 5 sub-agentes)

## Objetivos de Evolução (Auto-Gerenciados)

### Curto Prazo (1 semana)
- [ ] Dominar 10+ ferramentas MCP populares
- [ ] Mapear todos os provedores de IA gratuitos
- [ ] Integrar RAG com embeddings vetoriais

### Médio Prazo (1 mês)
- [ ] Implementar Tool Learning (aprender a usar novas ferramentas automaticamente)
- [ ] Integrar web scraping autônomo (Firecrawl/Crawl4AI)
- [ ] Adicionar capacidade de gerar e executar testes automaticamente

### Longo Prazo (3 meses)
- [ ] Multi-Agent Debate para decisões complexas
- [ ] Auto-deploy de aplicações geradas
- [ ] SDK de agentes para terceiros (marketplace)
