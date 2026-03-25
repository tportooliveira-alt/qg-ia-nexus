# NEXUS DEPLOY EXPERT — Conhecimento Completo de Plataformas

> Carregado automaticamente. Use para responder qualquer dúvida sobre hospedagem, deploy, frontend e infraestrutura.

---

## 🏆 RANKING GERAL POR CASO DE USO

| Caso de Uso | #1 Recomendação | Alternativa | Por quê |
|---|---|---|---|
| Frontend React/Next.js | **Vercel** | Cloudflare Pages | Deploy automático, CDN global, sem config |
| Site estático (Vite/Astro) | **Cloudflare Pages** | Netlify | Free ilimitado, mais rápido |
| API Node.js sempre ativa | **Railway** | Render (pago) | DX excelente, sem cold start |
| API Node.js barata | **Render** | Fly.io | Free tier (dorme mas funciona) |
| Hospedagem + Node.js PT-BR | **Hostinger** | HostGator | Melhor custo-benefício, hPanel |
| Banco Postgres gratuito | **Supabase** | Neon | Auth + Storage incluídos |
| Site WordPress | **Hostinger** | SiteGround | Otimizado, barato, suporte PT-BR |
| Escala enterprise | **AWS** | GCP | Mais completo, mais compliance |
| Containers/Docker | **Fly.io** | Railway | Multi-região, VMs persistentes |
| Tudo integrado (full-stack) | **Railway** | Render | Deploy banco + API juntos |

---

## 💰 COMPARATIVO DE PREÇOS (2025)

### Free Tiers que realmente valem a pena:
- **Cloudflare Pages**: ILIMITADO — builds, bandwidth, requests — melhor free tier do mercado
- **Vercel**: 100GB bandwidth/mês, projetos ilimitados, preview URLs
- **Netlify**: 100GB bandwidth, 300 min build/mês
- **Supabase**: 2 projetos, 500MB banco, 1GB storage (pausa após 1 sem inativo)
- **Render**: Web service free (dorme 15min sem uso, cold start 30-60s)
- **GitHub Pages**: Ilimitado para sites estáticos open source
- **Railway**: US$5 crédito/mês (trial, não free permanente)

### Preços pagos (mínimo para produção):
- **Vercel Pro**: US$20/usuário/mês
- **Netlify Pro**: US$19/usuário/mês
- **Render**: US$7/mês por serviço (sem sleep)
- **Railway**: Pay-as-you-go (~US$5-20/mês projetos pequenos)
- **Fly.io**: ~US$1.94/mês (VM smallest + shared CPU)
- **DigitalOcean Droplet**: US$4/mês (512MB RAM)
- **Hostinger Premium**: R$9,99-16,99/mês
- **AWS EC2 t3.micro**: ~US$8.50/mês (fora do free tier)

---

## 🚀 PLATAFORMAS — ANÁLISE DETALHADA

### VERCEL
- **Melhor para**: Next.js, React, frontends com SSR/SSG
- **Ponto forte**: Deploy em segundos via git push, Edge Network em 100+ países
- **Ponto fraco**: Caro para times, serverless tem cold start
- **Lock-in**: Alto (funções Edge são proprietárias)
- **Quando usar**: Qualquer projeto Next.js ou frontend profissional
- **Quando NÃO usar**: Backend com estado, WebSockets longos, processos pesados

### NETLIFY
- **Melhor para**: JAMstack, sites estáticos, SvelteKit, Astro, Hugo
- **Ponto forte**: Forms nativas, deploy fácil, split testing A/B
- **Ponto fraco**: Build minutes limitados no free (300/mês)
- **Quando usar**: Sites de conteúdo, landing pages, blogs
- **Quando NÃO usar**: Apps com muitos builds por dia

### CLOUDFLARE PAGES
- **Melhor para**: Sites estáticos ultra-rápidos, edge computing
- **Ponto forte**: Free tier ilimitado (bandwidth, requests, builds)
- **Ponto fraco**: Workers são diferentes do Node.js (V8 isolates)
- **Quando usar**: Quando o Vercel/Netlify free tier não é suficiente
- **Quando NÃO usar**: Apps que dependem de APIs Node.js complexas

### RENDER
- **Melhor para**: APIs Node.js/Python, workers, cron jobs, PostgreSQL
- **Ponto forte**: Deploy via Dockerfile, banco gerenciado incluído
- **Ponto fraco**: Free tier dorme (cold start de 30-60s)
- **Quando usar**: APIs de médio tráfego, projetos pessoais
- **Quando NÃO usar**: APIs que precisam responder imediatamente (use plano pago)

### RAILWAY
- **Melhor para**: Full-stack (API + banco juntos), prototipagem rápida
- **Ponto forte**: DX excepcional, deploy de banco com 1 clique, logs em tempo real
- **Ponto fraco**: Sem free tier permanente (US$5 crédito esgota rápido)
- **Quando usar**: Startups, MVPs, projetos que precisam de banco + API
- **Quando NÃO usar**: Projetos de longo prazo sem budget

### FLY.IO
- **Melhor para**: Apps globais, baixa latência, containers Docker, Go
- **Ponto forte**: Deploy em múltiplas regiões, VMs persistentes, WireGuard
- **Ponto fraco**: Curva de aprendizado maior (CLI flyctl)
- **Quando usar**: APIs de baixa latência que precisam estar perto do usuário
- **Quando NÃO usar**: Iniciantes ou projetos que não precisam de multi-região

### HEROKU
- **Status**: Eliminou free tier em 2022 — não recomendado para novos projetos
- **Alternativa**: Railway (mesma DX, mais barato)
- **Quando ainda usar**: Migração de projetos legados

### HOSTINGER
- **Melhor para**: Sites WordPress, pequenos negócios, hospedagem compartilhada + Node.js
- **Ponto forte**: Melhor custo-benefício do mercado, hPanel intuitivo, suporte PT-BR
- **Ponto fraco**: Recursos compartilhados (não é VPS), sem Docker
- **Node.js**: Suportado (versões 18, 20) via hPanel → Node.js App
- **Banco**: MySQL incluído, phpMyAdmin disponível
- **SSH**: Disponível nos planos Business+
- **Quando usar**: Sites WordPress, landing pages, APIs Node.js de baixo tráfego
- **Quando NÃO usar**: Apps de alto tráfego, microserviços, Docker

### AWS (Amazon Web Services)
- **Melhor para**: Enterprise, compliance, escala infinita
- **Serviços-chave para deploy**:
  - Amplify (frontends, similar ao Vercel)
  - S3 + CloudFront (sites estáticos, CDN global)
  - EC2 (VMs), ECS/Fargate (containers)
  - Lambda (serverless)
  - RDS (bancos relacionais gerenciados)
- **Ponto forte**: 300+ serviços, qualquer necessidade atendida
- **Ponto fraco**: Billing confuso, curva enorme, fácil de gastar mais do que deveria
- **Quando usar**: Empresas grandes, quando conformidade/compliance é exigida
- **Quando NÃO usar**: Startups (complexidade desnecessária no início)

### GOOGLE CLOUD PLATFORM (GCP)
- **Melhor para**: IA/ML workloads, Firebase, Cloud Run
- **Serviços-chave**:
  - Cloud Run (containers serverless — excelente para APIs)
  - Firebase (BaaS completo: banco, auth, hosting, funções)
  - App Engine (PaaS clássico)
  - GKE (Kubernetes gerenciado)
- **Ponto forte**: Cloud Run é o melhor serverless containers do mercado
- **Quando usar**: Projetos com TensorFlow/Vertex AI, apps Firebase

### DIGITALOCEAN
- **Melhor para**: VPS simples, banco gerenciado, App Platform
- **Ponto forte**: Documentação excelente, preço previsível, Spaces (S3-like)
- **App Platform**: Similar ao Heroku, suporte a Node.js/Python/Go/PHP
- **Banco gerenciado**: PostgreSQL, MySQL, Redis — todos gerenciados
- **Quando usar**: Quando precisa de VPS simples ou alternativa mais barata à AWS

### SUPABASE
- **Melhor para**: Backend completo com Postgres + Auth + Storage + Realtime
- **Substitui**: Firebase (mas com SQL)
- **Free tier**: 2 projetos, 500MB banco, 1GB storage, 50MB upload
- **Atenção**: Projetos free pausam após 1 semana sem atividade
- **Quando usar**: Apps que precisam de banco + autenticação + storage sem servidor próprio

### NEON
- **Melhor para**: PostgreSQL serverless, escala automática
- **Free tier**: 512MB, 1 branch, sem pause
- **Vantagem sobre Supabase**: Não pausa no free tier
- **Quando usar**: Quando precisa só do banco (sem auth/storage)

### PLANETSCALE
- **Melhor para**: MySQL com branching de banco de dados (como git para DB)
- **Atenção**: Removeu free tier em 2024 (hobby: US$39/mês)
- **Quando usar**: Grandes equipes que precisam de branching no banco

---

## 🎯 GUIA RÁPIDO DE DECISÃO

### "Tenho um site React/Vue e quero hospedar de graça"
→ **Cloudflare Pages** (ilimitado) ou **Vercel** (mais recursos para React)

### "Tenho uma API Node.js e quero hospedar de graça"
→ **Render** (free tier, dorme mas funciona) — aceitar o cold start ou pagar US$7/mês

### "Preciso de banco de dados gratuito"
→ **Supabase** (Postgres + auth + storage) ou **Neon** (só Postgres, não pausa)

### "Tenho pouco dinheiro, quero tudo junto"
→ **Railway** (US$5 crédito/mês cobre projetos pequenos) ou **Render** (free + banco)

### "Quero hospedar no Brasil com suporte em PT-BR"
→ **Hostinger** (melhor custo-benefício) ou **Locaweb**

### "Preciso de escala enterprise"
→ **AWS** (mais completo) → começar com Amplify + RDS + Lambda

### "Quero algo como Heroku mas mais barato"
→ **Railway** (mesma DX, sem free tier permanente) ou **Render** (free mas dorme)

### "Quero hospedar um WordPress"
→ **Hostinger** (otimizado, R$9,99/mês) ou **SiteGround** (suporte premium)

---

## ⚠️ ARMADILHAS COMUNS

1. **Vercel/Netlify free**: Bandwidth esgota rápido se viralizar — configure alertas
2. **Render free**: Cold start de 30-60s — não use para APIs críticas
3. **Railway**: O crédito de US$5 esgota em ~2 semanas com banco + API rodando
4. **Supabase free**: Projeto pausa após 7 dias sem acesso — use ping automático
5. **AWS**: Nunca deixe credenciais expostas no código — custo pode explodir
6. **PlanetScale**: Acabou com free tier — evite para novos projetos
7. **Heroku**: Caro demais desde que removeu free tier

---

## 🔗 INTEGRAÇÕES FRONTEND

| Framework | Melhor Deploy | Por quê |
|---|---|---|
| Next.js (App Router) | Vercel | Criado pela mesma empresa |
| Next.js (Pages Router) | Vercel ou Netlify | Ambos suportam bem |
| React (Vite/CRA) | Cloudflare Pages | Free ilimitado para estático |
| Vue / Nuxt | Netlify ou Vercel | Suporte nativo |
| SvelteKit | Vercel ou Netlify | Adapters oficiais |
| Astro | Cloudflare Pages | Perfeito para SSG/estático |
| Remix | Vercel ou Fly.io | Depende de server-side |
| Angular | Netlify ou GitHub Pages | Build estático funciona em qualquer lugar |
