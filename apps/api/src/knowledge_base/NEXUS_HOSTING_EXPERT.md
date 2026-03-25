# 🌐 NEXUS HOSTING EXPERT — Knowledge Base Completa

> **DIRETRIZ:** Ao responder sobre hospedagem, SEMPRE consulte este documento. Apresente opções com preços reais, prós, contras e a recomendação final personalizada.

---

## 1. TIPOS DE HOSPEDAGEM (Do mais simples ao mais complexo)

### 🟢 Shared Hosting (Hospedagem Compartilhada)
- **O que é:** Vários sites dividem o MESMO servidor (CPU, RAM, disco)
- **Ideal para:** Sites simples, blogs, landing pages, portfolios, WordPress
- **NÃO ideal para:** Apps com backend Node.js, APIs, tráfego alto
- **Preço:** R$ 5–40/mês (Hostinger R$ 7/mês, HostGator R$ 12/mês)
- **Limite:** ~50K visitas/mês, sem SSH em planos baratos
- **Vantagem:** Mais barato do mercado, painel cPanel incluso
- **Desvantagem:** Performance imprevisível (vizinho barulhento), sem controle de servidor

### 🟡 VPS (Virtual Private Server)
- **O que é:** Servidor virtual dedicado — você tem CPU/RAM garantidos
- **Ideal para:** Apps Node.js, Python, APIs REST, bancos de dados, projetos médios
- **Preço:** R$ 15–200/mês (Hostinger VPS R$ 15, DigitalOcean $4-12/mês, Vultr $2.50+)
- **Vantagem:** Controle total (root), pode instalar qualquer coisa, Node.js nativo
- **Desvantagem:** Precisa saber Linux/SSH, manutenção manual (updates, segurança)
- **⭐ NOTA:** É o que o QG IA usa hoje na Hostinger (VPS com Node.js)

### 🔵 Cloud Hosting
- **O que é:** Rede de servidores interconectados, escala automática
- **Ideal para:** Apps com tráfego variável, e-commerce, SaaS
- **Preço:** R$ 25–500/mês (DigitalOcean App Platform $5+, AWS EC2 $10+)
- **Vantagem:** Auto-scaling, alta disponibilidade, pay-as-you-go
- **Desvantagem:** Preço pode explodir sem controle, complexidade de gerenciamento

### 🟣 Serverless / Edge Computing
- **O que é:** Seu código roda sem servidor fixo — só executa quando chamado
- **Ideal para:** APIs leves, webhooks, funções isoladas, micro-serviços
- **Preço:** Geralmente grátis até certo limite, depois por execução
- **Plataformas:** Vercel Functions, Cloudflare Workers, AWS Lambda, Supabase Edge Functions
- **Vantagem:** Zero manutenção, escala infinita, paga só o que usa
- **Desvantagem:** Cold starts (demora na 1ª execução), limites de memória/tempo

### 🔴 Dedicado
- **O que é:** Servidor físico inteiro só para você
- **Ideal para:** Empresas grandes, bancos de dados massivos, compliance rigoroso
- **Preço:** R$ 500–5000+/mês
- **Vantagem:** Performance máxima, segurança total, sem compartilhamento
- **Desvantagem:** Muito caro, precisa de equipe DevOps

---

## 2. PLATAFORMAS DE DEPLOY PARA APPS (Comparativo 2025-2026)

### ⚡ TIER GRÁTIS (Para começar sem gastar)

| Plataforma | Free Tier | Ideal Para | Limitações |
|------------|-----------|------------|------------|
| **Vercel** | 100GB bandwidth, 100h build/mês | Next.js, React SPA | 1 deploy por commit, sem cron |
| **Netlify** | 100GB bandwidth, 300 build min/mês | Sites estáticos, JAMstack | Functions limitadas (125K/mês) |
| **Cloudflare Pages** | Ilimitado requests estáticos, 100K Workers/dia | SPA React, sites globais | SSR limitado |
| **Firebase Hosting** | 10GB storage, 10GB transfer/mês | SPA + Firebase backend | SSR precisa plano Blaze |
| **Railway** | $5 crédito/mês | Full-stack, Node.js, Postgres | Pausa após inatividade |
| **Render** | 750h/mês (shared) | APIs simples, sites estáticos | Cold start 30-60s, pausa |
| **Supabase** | 500MB DB, 50K MAUs | Backend (DB + Auth + Storage) | Pausa após 7 dias inativo |

### 💰 TIER PAGO (Produção real)

| Plataforma | Plano Inicial | Melhor Para | Preço Real |
|------------|--------------|-------------|------------|
| **Vercel Pro** | $20/user/mês | Next.js em produção | $20-100/mês (time pequeno) |
| **Netlify Pro** | $19/membro/mês | Sites com forms, identity | $19-99/mês |
| **Railway Pro** | $20/mês + uso | Full-stack com DB | $20-50/mês |
| **Render Starter** | $7/mês por serviço | APIs Node.js/Python | $7-25/mês (1 serviço) |
| **Fly.io** | $5 mínimo/mês | Apps globais, baixa latência | $5-30/mês |
| **DigitalOcean** | $4/mês (Droplet) | VPS + Apps + DB gerenciado | $4-50/mês |
| **Hostinger VPS** | R$ 15/mês | Node.js com controle total | R$ 15-80/mês |
| **AWS** | Pay-as-you-go | Enterprise, compliance | $10-1000+/mês |
| **Google Cloud Run** | Pay-per-use | Containers, APIs escaláveis | $0-50/mês (uso moderado) |

---

## 3. RECOMENDAÇÕES POR TIPO DE APP

### 📱 SPA (React/Vue/Angular puro — sem backend)
```
💰 BARATA: Cloudflare Pages (GRÁTIS, CDN global)
⚖️ CUSTO-BENEFÍCIO: Vercel Free (deploy automático via Git)
🏆 PREMIUM: Vercel Pro ($20/mês, analytics, preview deploys)
```

### 🖥️ Full-Stack (Next.js/Nuxt com SSR + API)
```
💰 BARATA: Railway Free ($5 crédito) ou Render Free
⚖️ CUSTO-BENEFÍCIO: Vercel Pro ($20/mês, otimizado pra Next.js)
🏆 PREMIUM: AWS + CloudFront ($50-200/mês, controle total)
```

### 🔌 API Backend (Node.js / Express / FastAPI)
```
💰 BARATA: Railway Free ou Render Free
⚖️ CUSTO-BENEFÍCIO: DigitalOcean App Platform ($5/mês) ou Fly.io ($5/mês)
🏆 PREMIUM: AWS ECS ou Google Cloud Run ($15-100/mês)
```

### 📊 Dashboard / ERP (App complexo com DB)
```
💰 BARATA: Hostinger VPS (R$ 15/mês) + Supabase Free
⚖️ CUSTO-BENEFÍCIO: DigitalOcean Droplet ($12/mês) + DB gerenciado ($15/mês)
🏆 PREMIUM: AWS RDS + ECS ($100-500/mês)
```

### 🤖 App com IA / Multi-Agent (como QG IA)
```
💰 BARATA: Hostinger VPS (R$ 25/mês) — controle total, Node.js nativo
⚖️ CUSTO-BENEFÍCIO: Railway Pro ($20/mês) ou Fly.io ($15/mês)
🏆 PREMIUM: DigitalOcean + Kubernetes ($50-200/mês)
```

### 🌎 Landing Page / Site Institucional
```
💰 BARATA: Cloudflare Pages (LITERALMENTE GRÁTIS)
⚖️ CUSTO-BENEFÍCIO: Netlify Free (forms + deploy automático)
🏆 PREMIUM: Vercel Pro ou Hostinger Premium (R$ 12/mês, domínio grátis)
```

---

## 4. CUSTOS OCULTOS (O que ninguém te conta)

| Custo | Onde aparece | Como evitar |
|-------|-------------|-------------|
| **Bandwidth (egress)** | AWS, Vercel, Fly.io | Use CDN (Cloudflare grátis) na frente |
| **Build minutes** | Vercel, Netlify | Otimize builds, use cache |
| **Cold starts** | Render Free, Lambda | Ping periódico ou plano pago |
| **SSL renovação** | Hostinger shared | Use Let's Encrypt (grátis) |
| **Backup** | VPS sem backup | Script cron + Supabase/S3 |
| **DB gerenciado** | DigitalOcean, AWS | Supabase Free para projetos menores |
| **Per-seat pricing** | Vercel Pro, Netlify Pro | Cada membro = +$19-20/mês |

---

## 5. MIGRAÇÃO ENTRE PROVEDORES

### Checklist de Migração
1. **DNS:** Altere o A/CNAME record para o novo IP (propaga em 2-48h)
2. **SSL:** Configure Let's Encrypt ou use Cloudflare SSL grátis
3. **Variáveis:** Copie TODAS as env vars do `.env` para o novo ambiente
4. **Banco de dados:** Exporte o dump e importe no novo servidor
5. **CI/CD:** Configure o novo webhook do GitHub para auto-deploy
6. **CORS:** Atualize os domínios permitidos no `server.js`
7. **Teste:** Verifique TODAS as rotas da API antes de apontar o domínio
8. **Rollback:** Mantenha o servidor antigo por 48h como backup

### Migração Específica: De Hostinger para Vercel/Railway
```
1. Frontend (SPA React) → Vercel (git push = deploy automático)
2. Backend (Node.js API) → Railway ($5/mês) com Dockerfile
3. DB → Supabase (já está lá) ou Railway Postgres
4. Domínio → Apontar para o novo IP no DNS da Hostinger
```

---

## 6. PARA O BRASIL — Dicas Especiais

- **Latência:** Vercel tem edge em São Paulo, Cloudflare tem PoP no Brasil
- **Pagamento:** Hostinger aceita Pix e boleto (vantagem enorme)
- **Preço em Real:** Hostinger e HostGator cobram em R$ (sem IOF de cartão)
- **Servidor Nacional:** Locaweb tem datacenter no Brasil (~20ms latência)
- **CDN grátis:** Cloudflare Free funciona perfeitamente para sites brasileiros

---

**ESTADO:** HostingExpert está online, com conhecimento atualizado de 2025-2026 sobre todas as plataformas de hospedagem do mercado.
