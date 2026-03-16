# ⚔️ QG IA — NEXUS CLAW: PLANO COMPLETO DE IMPLEMENTAÇÃO
### Versão 1.0 — Março 2026

---

## 🧠 O QUE É O NEXUS CLAW (Visão Geral)

O Nexus Claw é um **Sistema de Inteligência Autônomo Pessoal** — um quartel general de IA que orquestra 6 provedores de IA em cascata, executa pesquisas autônomas, gerencia aprovações e projetos, e se integra ao WhatsApp da Priscila.

### Comparação com projetos similares no mercado:
| Projeto | O que faz | Diferença do Nexus |
|---------|-----------|-------------------|
| [AutoGen (Microsoft)](https://www.kubiya.ai/blog/ai-agent-orchestration-frameworks) | Multi-agentes autônomos | Nexus é pessoal, WhatsApp-first, sem custo de infra |
| [BabyAGI](https://livechatai.com/blog/llm-agent-frameworks) | Agente auto-melhorador | Nexus tem dashboard real + aprovações humanas |
| [n8n + OpenRouter](https://medium.com/@skpumar05/building-an-ai-powered-whatsapp-agent-using-n8n-openrouter-node-js-fa7ab8980cf5) | Automação WhatsApp + IA | Nexus é mais completo: memória, terminal, pesquisa |
| [Supabase AI Chatbot](https://github.com/supabase-community/vercel-ai-chatbot) | Chat com banco de dados | Nexus vai além: agente autônomo + operações reais |

### Vantagem única do Nexus:
- Custo **R$0** de IA (cascata de APIs gratuitas/baratas)
- Controle total via **WhatsApp** (sem app adicional)
- **Governança humana** — nada executa sem aprovação
- **Auto-evolução** — aprende e salva conhecimento

---

## 📊 ESTADO ATUAL (Março 2026)

### ✅ O que já está funcionando:
- [x] Servidor Node.js rodando 24/7 no Render
- [x] Dashboard com 7 abas completo
- [x] Chat com Nexus (6 IAs em cascata)
- [x] IdeaOrganizer embutido no dashboard
- [x] WhatsApp Bot conectado (local)
- [x] Pesquisa autônoma a cada 6h
- [x] Memórias salvas no Supabase
- [x] Sistema de aprovações
- [x] Terminal root com auto-healing
- [x] MySQL conectado (local)
- [x] GitHub + deploy automático

### ❌ O que ainda precisa ser resolvido:
- [ ] MySQL bloqueado no Render (Hostinger bloqueia IPs externos)
- [ ] WhatsApp não funciona no Render (precisa de solução de persistência)
- [ ] Segurança completa (HTTPS, rate limiting global)
- [ ] Dashboard financeiro (DRE, fluxo de caixa)
- [ ] Histórico do chat salvo

---

## 🗺️ FASES DO PLANO

---

### 🔴 FASE 1 — ESTABILIZAÇÃO (Próxima semana)
*Objetivo: Corrigir o que está quebrado e garantir 100% de confiabilidade*

#### 1.1 MySQL no Render
**Problema:** Hostinger bloqueia o IP do Render (74.220.48.245)
**Solução:** No painel da Hostinger → MySQL → Acesso Remoto → adicionar o IP do Render
**Impacto:** Módulo financeiro funcionará na nuvem
**Tempo:** 15 minutos

#### 1.2 WhatsApp na Nuvem
**Problema:** auth_info_baileys fica local, Render perde ao reiniciar
**Solução:** Migrar auth para Supabase Storage (salvar os arquivos em base64)
**Impacto:** Bot WhatsApp funcionará 24/7 sem precisar do PC ligado
**Tempo:** 2 horas

#### 1.3 Histórico do Chat
**Problema:** Conversa some ao recarregar a página
**Solução:** Salvar mensagens no Supabase (tabela `chat_history`)
**Impacto:** Nexus lembra das conversas anteriores
**Tempo:** 1 hora

---

### 🟡 FASE 2 — EXPANSÃO DE FUNCIONALIDADES (Próximas 2 semanas)
*Objetivo: Adicionar as funcionalidades mais impactantes para o dia a dia*

#### 2.1 Dashboard Financeiro
**O que fazer:**
- Aba nova "💰 Financeiro" no dashboard
- Gráfico de receitas vs despesas (MySQL)
- DRE simplificado por projeto
- Botão para registrar transação manual
**Impacto:** Visão financeira de todos os projetos num lugar só
**Tempo:** 3 horas

#### 2.2 Alertas Proativos no WhatsApp
**O que fazer:**
- Nexus manda mensagem quando: aprovação pendente > 1h
- Alerta quando servidor reiniciar
- Resumo diário às 8h com: pesquisas do dia, pendências, status
**Impacto:** Priscila fica informada sem precisar abrir o dashboard
**Tempo:** 2 horas

#### 2.3 Nexus ↔ IdeaOrganizer Conectados
**O que fazer:**
- Quando pesquisa autônoma encontrar algo bom, criar ideia automaticamente no IdeaOrganizer
- Nexus pode consultar ideias salvas para contextualizar respostas
**Impacto:** Os dois sistemas se alimentam mutuamente
**Tempo:** 3 horas

#### 2.4 Segurança Completa
**O que fazer:**
- Rate limiting global (bloqueio por IP)
- Headers de segurança (Helmet.js)
- Log de tentativas de acesso negadas
- Rotação automática de token sugerida a cada 90 dias
**Tempo:** 2 horas

---

### 🟢 FASE 3 — INTELIGÊNCIA AVANÇADA (Próximo mês)
*Objetivo: Nexus começa a operar com mais autonomia e inteligência*

#### 3.1 Memória Biográfica da Priscila
**O que fazer:**
- Nexus acumula preferências, projetos, histórico de decisões
- VidaDigital.json vira banco de dados dinâmico que cresce
- Nexus antecipa pedidos baseado no histórico
**Impacto:** Conversas ficam cada vez mais personalizadas e precisas
**Tempo:** 4 horas

#### 3.2 Pesquisa com Contexto de Projetos
**O que fazer:**
- Cron de pesquisa considera os projetos ativos (AgroMacro, FrigoGest, etc.)
- Pesquisa tendências específicas para cada projeto
- Alerta quando encontrar algo relevante
**Impacto:** Nexus traz insights diretamente aplicáveis
**Tempo:** 2 horas

#### 3.3 Dashboard Mobile-Friendly
**O que fazer:**
- Redesign responsivo para funcionar bem no celular
- Menu hambúrguer nas abas
- Cards maiores e botões touch-friendly
**Impacto:** Priscila consegue usar tudo pelo celular
**Tempo:** 3 horas

#### 3.4 Monitoramento de Custos de IA
**O que fazer:**
- Rastrear quantas chamadas cada IA recebe
- Mostrar custo estimado no dashboard
- Sugerir troca de provider quando custo subir
**Impacto:** Total controle sobre gastos com APIs
**Tempo:** 3 horas

---

### 🔵 FASE 4 — SINGULARIDADE (Próximos 3 meses)
*Objetivo: Nexus vira um sistema verdadeiramente autônomo e gerador de valor*

#### 4.1 Integração MCP (Model Context Protocol)
**O que fazer:**
- Conectar Nexus a servidores MCP externos (GitHub, Notion, Google Drive)
- Nexus consegue ler e escrever em qualquer ferramenta
**Impacto:** Nexus vira o hub central de toda a vida digital
**Referência:** [Claude com MCP](https://www.kubiya.ai/blog/ai-agent-orchestration-frameworks)
**Tempo:** 8 horas

#### 4.2 Multi-Agente Especializado
**O que fazer:**
- Agente Agro (especialista em AgroMacro)
- Agente Frigorífico (especialista em FrigoGest)
- Agente Financeiro (especialista em DRE e fluxo)
- Orquestrador decide qual agente usar para cada pergunta
**Impacto:** Respostas muito mais precisas por domínio
**Tempo:** 10 horas

#### 4.3 Voz via WhatsApp
**O que fazer:**
- Priscila manda áudio no WhatsApp
- Nexus transcreve (Whisper/Groq) e processa como comando de texto
- Responde de volta em texto ou áudio
**Impacto:** Controle total por voz, mãos livres
**Tempo:** 6 horas

#### 4.4 Nexus como Produto (Monetização)
**O que fazer:**
- Empacotar Nexus como produto SaaS para outros empreendedores
- Dashboard white-label configurável
- Planos: Básico (1 IA), Pro (cascata completa), Enterprise (WhatsApp + auto-pesquisa)
**Impacto:** Geração de receita direta a partir do que já foi construído
**Referência:** [Micro-SaaS de IA pessoal](https://livechatai.com/blog/llm-agent-frameworks) — TAM enorme
**Tempo:** 20 horas

---

## 📅 CRONOGRAMA SUGERIDO

```
MARÇO 2026 (semana 3-4)
├── Fase 1.1: MySQL no Render          [15min] ← COMEÇAR AQUI
├── Fase 1.2: WhatsApp na nuvem        [2h]
└── Fase 1.3: Histórico do chat        [1h]

ABRIL 2026 (semana 1-2)
├── Fase 2.1: Dashboard financeiro     [3h]
├── Fase 2.2: Alertas WhatsApp         [2h]
├── Fase 2.3: Nexus ↔ IdeaOrganizer   [3h]
└── Fase 2.4: Segurança completa       [2h]

ABRIL 2026 (semana 3-4)
├── Fase 3.1: Memória biográfica       [4h]
├── Fase 3.2: Pesquisa com contexto    [2h]
├── Fase 3.3: Dashboard mobile         [3h]
└── Fase 3.4: Monitor de custos IA     [3h]

MAIO-JUNHO 2026
├── Fase 4.1: Integração MCP           [8h]
├── Fase 4.2: Multi-agente             [10h]
├── Fase 4.3: Voz via WhatsApp         [6h]
└── Fase 4.4: Nexus como produto       [20h]
```

---

## 🎯 PRIORIDADE IMEDIATA (Próxima sessão)

1. **Liberar MySQL no Hostinger** para o IP do Render (54.218.x.x / 44.226.x.x)
2. **WhatsApp na nuvem** — persistir auth no Supabase Storage
3. **Histórico do chat** — tabela `chat_history` no Supabase

---

## 💡 INSIGHTS DO MERCADO

Com base nas tendências de 2025:

1. **Sistemas multi-LLM** como o Nexus são a vanguarda — empresas como Deloitte já reportam que 25% dos negócios estão adotando agentes autônomos ([fonte](https://www.domo.com/learn/article/best-ai-orchestration-platforms))

2. **WhatsApp como interface de IA** é um mercado enorme no Brasil — diferencial competitivo real

3. **O Nexus tem potencial de produto**: empacotar o que foi construído como SaaS para empreendedores poderia gerar R$500-2000/mês com poucos clientes

4. **Ponto cego atual**: o Nexus ainda não tem RAG (Retrieval Augmented Generation) — adicionar busca vetorial no Supabase multiplicaria a qualidade das respostas

---

_Plano criado em: 12/03/2026_
_Próxima revisão: 01/04/2026_
_Autor: Claude Sonnet 4.6 + Priscila_
