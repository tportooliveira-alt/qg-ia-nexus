# 05 — Análise de Mercado (o que os melhores fazem)

## Apps estudados

| App | Stars | O que é |
|-----|-------|---------|
| **LibreChat** | ~22k ⭐ | Chat multi-provedor mais completo do mercado |
| **LobeHub** | ~50k ⭐ | Hub de agentes com MCP e memória estruturada |
| **ChatbotUI** | ~33k ⭐ | Interface limpa Supabase-first |
| **LangChain** | ~100k ⭐ | Framework de orquestração de agentes |

---

## O que cada um tem de melhor

### LibreChat — referência em multi-provedor
- **Resumable SSE streams:** Conexão cai → reconecta do ponto que parou (session ID)
- **Conversation branching:** Edita uma mensagem → cria fork → explora alternativas
- **Code interpreter sandbox:** Executa Python/Node/Go/Java gerado pela IA com segurança
- **Import/export:** Move conversas do ChatGPT para o LibreChat
- **Busca em conversas:** Full-text search em todo histórico

### LobeHub — referência em agentes e MCP
- **MCP integration:** Conecta a 10.000+ ferramentas externas (calendário, e-mail, GitHub, banco de dados)
- **Agent groups:** Organiza agentes por projeto/domínio (não só um único "assistente")
- **Memória transparente:** Usuário VÊ o que o sistema lembra, pode editar
- **Personal memory:** IA se adapta ao usuário com base no histórico de uso
- **CRDT sync:** Sincroniza entre múltiplos dispositivos

### ChatbotUI — referência em arquitetura limpa
- **SPA + Supabase:** Tudo em um único frontend, sem backend complexo
- **Zero lock-in:** Usuário traz suas próprias chaves de API
- **Deploy simples:** Vercel + Supabase = 5 minutos

### LangChain — referência em orquestração
- **Abstraction layer:** Troca de provedor sem mudar código (`llm = ChatAnthropic()` → `llm = ChatGemini()`)
- **LangGraph:** Orquestra workflows complexos com controle explícito

---

## Comparativo: QG IA Nexus vs. concorrentes

| Capacidade | LibreChat | LobeHub | QG Nexus hoje | QG Nexus v2 |
|-----------|-----------|---------|---------------|-------------|
| Multi-provedor com cascade | ✅ | ✅ | ✅ | ✅ |
| Streaming SSE | ✅ | ✅ | ✅ | ✅ |
| Memória persistente | ✅ | ✅ | ✅ | ✅ |
| WhatsApp como interface | ❌ | ❌ | ✅ | ✅ |
| Pipeline de geração de apps | ❌ | ❌ | ✅ | ✅ |
| Knowledge Base multi-domínio | ❌ | parcial | ✅ | ✅ |
| Agentes especializados 7 domínios | ❌ | ❌ | ✅ | ✅ |
| MCP integration | ❌ | ✅ 10k+ | ❌ | ✅ planejado |
| SSE resumível | ✅ | ❌ | ❌ | ✅ planejado |
| Branching de conversa | ✅ | ✅ | ❌ | ✅ planejado |
| Visualização de memória | ❌ | ✅ | ❌ | ✅ planejado |
| Custo por resposta | ✅ | ✅ | ❌ | ✅ planejado |
| Frontend profissional React | ✅ | ✅ | ❌ (HTML) | ✅ planejado |
| Sandbox de código | ✅ | ❌ | ❌ | futuro |

---

## O que devemos roubar e adaptar

### TIER 1 — Implementar agora (diferenciam o produto)

**1. MCP Integration** (de LobeHub)
- Conecta o QG a ferramentas externas: Google Calendar, GitHub, banco de dados, buscas
- Uma vez implementado, qualquer nova ferramenta vira 5 linhas de config
- `mcpService.js` já está no plano

**2. SSE Resumível** (de LibreChat)
- Hoje: conexão cai → perde a resposta
- Com session ID: reconecta e continua de onde parou
- `sessionService.js` já está no plano

**3. Pipeline Kanban visual** (nossa inovação)
- Nenhum concorrente mostra o pipeline da Fábrica de IA visualmente
- `PipelineKanban.tsx` — ver cada agente em tempo real

**4. Provider Badge + Domain Badge** (nossa inovação)
- Mostrar qual IA respondeu + qual domínio foi detectado
- Transparência que nenhum concorrente tem por padrão

### TIER 2 — Implementar na Fase 3

**5. Conversation Branching** (de LibreChat)
- Fork de conversa: "e se eu tivesse perguntado diferente?"
- `ConversationBranch.tsx`

**6. Memory Visualization** (de LobeHub)
- Painel que mostra o que o Nexus lembra de você
- `MemoryDashboard.tsx`

**7. Cost per interaction** (de LibreChat)
- Tokens usados + custo em USD por resposta
- `CostIndicator.tsx`

### TIER 3 — Futuro

**8. Code sandbox** (de LibreChat) — executar código gerado com segurança
**9. Multi-device sync** (de LobeHub) — CRDT ou Redis
**10. Observability layer** — LangSmith-like para debugging

---

## Nossa vantagem competitiva

O que temos que **nenhum dos apps acima tem:**

1. **WhatsApp como interface primária** — pessoal, sem atrito, já no celular
2. **Fábrica de IA** — gera apps completos automaticamente (nenhum tem isso)
3. **Knowledge Base de 7 disciplinas de engenharia** — agro, civil, mecânico, elétrico, químico, produto, integração
4. **Cascade automático de 6 provedores** — nunca trava por quota
5. **Projetos reais conectados** — FrigoGest, AgroMacro, fazenda Antares

Isso nos coloca em uma categoria diferente: não somos só um "chat com IA" — somos um **QG operacional** para projetos complexos.
