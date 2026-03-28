# 🛠️ Market Tools & Integrations

## Ferramentas de Mercado para o Nexus Integrar

### 🤖 Frameworks de Agentes IA

#### LangChain.js
- **O que faz**: Framework para construir aplicações com LLMs (chains, agents, tools)
- **npm**: `langchain`
- **Utilidade**: Construir chains complexas com memória e tools
- **Free**: ✅ Open source
- **Quando usar**: Quando precisar de RAG avançado ou chains multi-step

#### CrewAI
- **O que faz**: Framework para orquestração de múltiplos agentes com roles
- **Python**: `pip install crewai`
- **Utilidade**: Orquestrar agentes especializados em tarefas complexas
- **Free**: ✅ Open source
- **Quando usar**: Projetos que precisam de equipe de agentes colaborativos

#### AutoGen (Microsoft)
- **O que faz**: Framework multi-agente conversacional
- **Python**: `pip install autogen`
- **Utilidade**: Debates entre agentes, code generation com feedback
- **Free**: ✅ Open source

#### LlamaIndex
- **O que faz**: Framework de RAG (Retrieval Augmented Generation)
- **npm**: `llamaindex`
- **Utilidade**: Conectar LLMs a dados estruturados e documentos
- **Free**: ✅ Open source

### 📊 Bancos de Dados Modernos

#### Supabase ✅ (já integrado)
- PostgreSQL + Auth + Storage + Realtime + Edge Functions
- Free tier: 500MB database, 1GB storage

#### Neon (Serverless Postgres)
- **URL**: https://neon.tech
- **npm**: `@neondatabase/serverless`
- **Free**: 3GB storage, auto-suspend
- **Vantagem**: Branching de database (como Git para banco)

#### Upstash (Redis Serverless)
- **URL**: https://upstash.com
- **npm**: `@upstash/redis`
- **Free**: 10K commands/dia
- **Vantagem**: Cache, rate limiting, message queues

#### Turso (SQLite Edge)
- **URL**: https://turso.tech
- **npm**: `@libsql/client`
- **Free**: 9GB storage, 500 databases
- **Vantagem**: SQLite na edge, replicação global

### 🚀 Deploy & Hosting

#### Vercel
- **Free tier**: Unlimited deploys, 100GB bandwidth
- **Melhor para**: Frontend React/Next.js, API Routes

#### Railway
- **Free tier**: $5/mês crédito
- **Melhor para**: Backend Node.js, databases

#### Fly.io
- **Free tier**: 3 VMs, 3GB volumes
- **Melhor para**: APIs globais, Docker containers

#### Coolify
- **Self-hosted**: Alternativa open-source ao Heroku
- **Melhor para**: Deploy no próprio VPS (Hostinger!)
- **NOTA**: Ideal para o Nexus rodar deploys autônomos

### 📧 Comunicação & Notificações

#### Resend (Email API)
- **URL**: https://resend.com/api
- **Free**: 3000 emails/mês
- **npm**: `resend`
- **Uso**: Relatórios, alertas, confirmações

#### Evolution API (WhatsApp)
- **URL**: https://doc.evolution-api.com/
- **Free**: Open source, self-hosted
- **Docker**: `docker pull atendai/evolution-api`
- **Uso**: WhatsApp multi-número com webhooks

### 🔍 Web Scraping & Pesquisa

#### Firecrawl
- **URL**: https://firecrawl.dev
- **Free**: 500 créditos/mês
- **npm**: `@mendable/firecrawl-js`
- **Uso**: Converter qualquer website em dados estruturados

#### Crawl4AI
- **Python**: `pip install crawl4ai`
- **Free**: ✅ Open source
- **Uso**: Scraping otimizado para LLMs

#### Jina AI Reader
- **URL**: https://r.jina.ai/{url}
- **Free**: Generoso
- **Uso**: Converte URL em texto limpo (markdown)
- **Exemplo**: `fetch("https://r.jina.ai/https://example.com")`

### 📊 Analytics & Monitoring

#### PostHog
- **Free**: 1M eventos/mês
- **npm**: `posthog-node`
- **Uso**: Analytics de produto, feature flags

#### Sentry
- **Free**: 5K erros/mês
- **npm**: `@sentry/node`
- **Uso**: Monitoramento de erros em produção

### 🧮 Pagamentos (Mercado Brasileiro)

#### MercadoPago
- **npm**: `mercadopago`
- **Taxas**: 4.99% por transação
- **Uso**: Pix, cartão, boleto

#### Stripe
- **npm**: `stripe`
- **Taxas**: 3.99% + R$0.39
- **Uso**: Assinaturas recorrentes (SaaS)

## Prioridade de Integração

### Imediata (esta semana)
1. ✅ MCP Servers (filesystem, web search) — já tem mcpService.js
2. Jina AI Reader — pesquisa web sem scraping complexo
3. Upstash Redis — cache para respostas de IA (economia de tokens)

### Curto Prazo (2 semanas)
4. Coolify no VPS — auto-deploy de apps gerados
5. Resend — emails de relatório para Priscila
6. PostHog — analytics de uso do Nexus

### Médio Prazo (1 mês)
7. LlamaIndex — RAG avançado com embeddings
8. Neon ou Turso — banco adicional para apps gerados
9. Evolution API — WhatsApp multi-instância
