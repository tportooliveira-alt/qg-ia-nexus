# ESTUDO: Design & Architecture Engineer para Apps de IA

## 📋 Visão Geral

O **Design & Architecture Engineer** é o profissional que define **como o sistema vai parecer e como vai funcionar** antes de qualquer linha de código. Em sistemas de IA, esse papel é crítico porque a complexidade é alta — múltiplos agentes, fluxos não-lineares, estados intermediários visíveis, memória compartilhada — e sem um design e arquitetura bem definidos, o resultado é sempre o mesmo: código espalhado, usuário confuso e sistema impossível de escalar.

Este estudo foi aprofundado com foco no **ecossistema QG IA Nexus** — um hub central de IA com múltiplos apps satélite — para que cada decisão de design e arquitetura seja aplicável diretamente nos nossos projetos.

---

## 🎯 O Que Este Profissional Faz

### Como Designer de Sistemas IA
- **Desenha o fluxo antes de codificar** — mapeia entradas, saídas, estados, decisões
- **Define a UX de IA** — como o usuário percebe e interage com agentes invisíveis
- **Cria sistemas de design** — paletas, tipografia, componentes reutilizáveis
- **Projeta para incerteza** — IA falha, atrasa, surpreende — o design deve lidar com isso
- **Design de feedback loops** — loading states, streaming text, erros humanizados

### Como Arquiteto de Sistemas
- **Define a estrutura macro** — quais serviços existem, como se comunicam
- **Escolhe os padrões** — REST, SSE, WebSocket, message queue
- **Planeja escalabilidade** — o que acontece com 10x mais usuários
- **Define contratos de API** — tipos, formatos, versionamento
- **Gerencia complexidade** — divide em partes que humanos conseguem entender

---

## 🏗️ ARQUITETURA DO ECOSSISTEMA QG IA (Estudo de Caso Real)

### Visão Macro — Hub-and-Spoke Architecture

```
                    ┌─────────────────────────────────┐
                    │        QG-IA-NEXUS HUB           │
                    │                                  │
                    │  ┌─────────┐  ┌───────────────┐  │
                    │  │ AI      │  │ Memory        │  │
                    │  │ Cascade │  │ (Supabase)    │  │
                    │  └─────────┘  └───────────────┘  │
                    │                                  │
                    │  ┌─────────┐  ┌───────────────┐  │
                    │  │ Router  │  │ Knowledge Base│  │
                    │  │(domain) │  │ (MD + cache)  │  │
                    │  └─────────┘  └───────────────┘  │
                    │                                  │
                    │  ┌─────────────────────────────┐  │
                    │  │     Fábrica de IA            │  │
                    │  │  Analista→Coder→Auditor      │  │
                    │  └─────────────────────────────┘  │
                    └────────────────┬────────────────┘
                                     │
               ┌─────────────────────┼─────────────────────┐
               │                     │                     │
    ┌──────────▼───────┐  ┌──────────▼───────┐  ┌─────────▼────────┐
    │   FRIGOGEST      │  │    AGROMACRO     │  │  GESTAO-ANTARES  │
    │  (Frigorífico)   │  │ (Pecuária/Agro)  │  │  (Fazenda Geral) │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
               │                     │                     │
    ┌──────────▼───────┐  ┌──────────▼───────┐
    │    WhatsApp      │  │   Web Dashboard  │
    │    (Baileys)     │  │    (HTML/SSE)    │
    └──────────────────┘  └──────────────────┘
```

**Por que Hub-and-Spoke?**
- Um ponto central de inteligência → memória compartilhada entre apps
- Mudança no modelo de IA = muda em um lugar, todos os satélites se beneficiam
- Auditoria centralizada — tudo passa pelo hub, tudo é logado
- Custo otimizado — uma cascata de IAs para todos, não uma por app

---

### Arquitetura Interna do Hub (camadas)

```
CAMADA 1 — ENTRADA (Ingress)
┌────────────┬────────────┬────────────┬────────────┐
│ HTTP REST  │  SSE Stream│  WhatsApp  │  Webhooks  │
└──────┬─────┴──────┬─────┴──────┬─────┴──────┬─────┘
       └────────────┴────────────┴────────────┘
                           │
CAMADA 2 — AUTH + RATE LIMIT
┌────────────────────────────────────────────────────┐
│  autenticarToken() + rateLimiter(n req/min)        │
└────────────────────────┬───────────────────────────┘
                         │
CAMADA 3 — ROTEAMENTO INTELIGENTE
┌────────────────────────────────────────────────────┐
│  routingService → detectDomain() → agentRouting    │
│  Domínios: código, finanças, agro, pessoal, urgente│
└────────────────────────┬───────────────────────────┘
                         │
CAMADA 4 — CONTEXTO E MEMÓRIA
┌────────────────────────────────────────────────────┐
│  nexusService.carregarContextoOtimizado()           │
│  Knowledge Base (cache 5min) + Memória Supabase    │
│  VidaDigital.json (perfil sempre carregado)         │
└────────────────────────┬───────────────────────────┘
                         │
CAMADA 5 — PROCESSAMENTO IA
┌────────────────────────────────────────────────────┐
│  aiService.chamarIAComCascata()                    │
│  Gemini → DeepSeek → Anthropic → Groq → Cerebras  │
│  Failover automático em 429/timeout/erro           │
└────────────────────────┬───────────────────────────┘
                         │
CAMADA 6 — SAÍDA
┌────────────────────────────────────────────────────┐
│  Resposta JSON │ SSE streaming │ Mensagem WhatsApp │
│  auditService.log() em paralelo                    │
└────────────────────────────────────────────────────┘
```

---

### Padrão de Comunicação dos Satélites

```javascript
// CONTRATO UNIVERSAL — todos os apps satélite usam exatamente este padrão
class QGNexusClient {
  constructor(token, baseUrl = 'https://qg-ia-nexus.onrender.com') {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  // Para respostas completas (simples)
  async consultar(prompt, contexto = '') {
    const res = await fetch(`${this.baseUrl}/api/nexus/comando`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, contexto })
    });
    const data = await res.json();
    return data.resposta;
  }

  // Para respostas em tempo real (streaming)
  async consultarStream(prompt, onChunk, onDone) {
    const res = await fetch(`${this.baseUrl}/api/nexus/stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) { onDone(); break; }
      const chunk = decoder.decode(value);
      // Parse SSE: data: {"chunk":"..."}\n\n
      chunk.split('\n').forEach(line => {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.chunk) onChunk(data.chunk);
        }
      });
    }
  }
}
```

---

## 🎨 DESIGN SYSTEM — QG IA VISUAL IDENTITY

### Princípios de Design

**1. Dark First**
Todos os apps do ecossistema são dark mode. Usuária trabalha com dados o dia todo — olhos descansam com dark.

**2. Dados em Evidência**
Gráficos, números, status — sempre em primeiro plano. IA é suporte, não protagonista.

**3. Feedback Imediato**
Toda ação tem resposta visual em < 100ms. Carregamentos têm progress visível. IA respondendo tem animação.

**4. Mobile-First**
AgroMacro, FrigoGest — todos são usados no campo, no celular. Desktop é complemento.

**5. Confiança por Transparência**
O sistema deve mostrar de qual IA veio a resposta, qual nível de confiança, o que está fazendo. IA opaca gera desconfiança.

---

### Paleta de Cores (Tokens CSS)

```css
:root {
  /* Backgrounds */
  --bg-base:       #0A0A0F;  /* fundo raiz — quase preto azulado */
  --bg-surface:    #12121A;  /* cards, painéis */
  --bg-elevated:   #1A1A2E;  /* modais, dropdowns */
  --bg-hover:      #1E1E30;  /* hover states */

  /* Primária — Violeta IA */
  --primary-50:    #F0EEFF;
  --primary-400:   #8B6FE8;
  --primary-500:   #6C47D4;  /* botões principais */
  --primary-600:   #5535B8;
  --primary-glow:  rgba(108, 71, 212, 0.3);

  /* Acento — Ciano Dados */
  --accent-400:    #22D3EE;  /* gráficos, highlights */
  --accent-500:    #06B6D4;
  --accent-glow:   rgba(6, 182, 212, 0.2);

  /* Semânticas */
  --success:       #10B981;  /* verde — OK, aprovado */
  --warning:       #F59E0B;  /* âmbar — atenção */
  --danger:        #EF4444;  /* vermelho — erro, risco */
  --info:          #3B82F6;  /* azul — informação */

  /* Texto */
  --text-primary:  #F1F5F9;  /* texto principal */
  --text-secondary:#94A3B8;  /* texto auxiliar */
  --text-muted:    #475569;  /* texto desabilitado */

  /* Bordas */
  --border:        rgba(255,255,255,0.08);
  --border-active: rgba(108,71,212,0.5);

  /* Agro (específico AgroMacro) */
  --agro-green:    #22C55E;
  --agro-earth:    #92400E;
  --agro-sky:      #0EA5E9;

  /* Frigorifico (específico FrigoGest) */
  --frigo-ice:     #BAE6FD;
  --frigo-meat:    #F87171;
  --frigo-metal:   #334155;
}
```

---

### Tipografia

```css
/* Sistema de fontes */
--font-sans:  'Inter', -apple-system, sans-serif;    /* UI geral */
--font-mono:  'JetBrains Mono', 'Fira Code', monospace; /* dados, código */
--font-display: 'Inter', sans-serif;                  /* títulos */

/* Escala de tamanhos */
--text-xs:   0.75rem;   /* 12px — labels, badges */
--text-sm:   0.875rem;  /* 14px — texto auxiliar */
--text-base: 1rem;      /* 16px — texto principal */
--text-lg:   1.125rem;  /* 18px — subtítulos */
--text-xl:   1.25rem;   /* 20px — títulos de seção */
--text-2xl:  1.5rem;    /* 24px — títulos de página */
--text-3xl:  1.875rem;  /* 30px — números grandes */
--text-4xl:  2.25rem;   /* 36px — KPIs principais */
```

---

### Componentes do Design System

#### 1. AI Status Badge — mostra qual IA está respondendo
```
┌────────────────────────────────────┐
│  ● Gemini Pro     ⚡ 340ms          │
│  ○ DeepSeek (fallback disponível)  │
└────────────────────────────────────┘
```

#### 2. Streaming Text — texto que aparece token a token
```
┌────────────────────────────────────────────┐
│  🤖 Nexus Claw                             │
│                                            │
│  Com base nos dados do rebanho, o GMD      │
│  médio do Lote A está em 1,2 kg/dia,       │
│  abaixo do esperado para a raça...▌        │
│                                            │
│  ████████░░░░░░░░░░░  Gerando...           │
└────────────────────────────────────────────┘
```

#### 3. Domain Indicator — mostra qual domínio foi detectado
```
┌──────────────────────────────────────────┐
│  Domínio detectado:  🐄 AGROPECUÁRIA     │
│  Confiança: 94%  │  Agente: NexusClaw    │
└──────────────────────────────────────────┘
```

#### 4. Agent Pipeline Visual — para a Fábrica de IA
```
  ✅ Analista    ────→    ✅ Arquiteto    ────→    ⏳ Coder
  "Ideia OK"              "Stack: React"           "Gerando..."
                                                        │
  ○ Auditor    ←──────────────────────────────────────○ Revisor
```

#### 5. Knowledge Base Status
```
┌─────────────────────────────────────────────┐
│  📚 Knowledge Base                     ●    │
│                                             │
│  ✓ NEXUS_CORE_KNOWLEDGE      34KB  cached   │
│  ✓ NEXUS_MASTER_ROADMAP      28KB  cached   │
│  ✓ NEXUS_FINANCE_EXPERT      41KB  cached   │
│  ✓ NEXUS_TECH_RADAR          22KB  cached   │
│  ↻ Cache expira em  4min 23s                │
└─────────────────────────────────────────────┘
```

---

## 🔄 PADRÕES DE UX PARA APPS DE IA

### 1. Skeleton Loading (não spinner)
```
Ruim:  ⠸ Carregando...  (usuário não sabe quanto vai demorar)

Bom:
┌────────────────────────────────┐
│  ████████████░░░░░░  GMD       │
│  ████░░░░░░░░░░░░░  Receita    │
│  ██████████░░░░░░░  Estoque    │
└────────────────────────────────┘
(usuário vê a estrutura, sabe o que vai aparecer)
```

### 2. Optimistic UI (atualiza antes da confirmação)
```
Usuário clica "Salvar" → UI atualiza imediatamente
→ Se servidor confirma: mantém
→ Se servidor rejeita: reverte com mensagem clara
(Resultado: app parece instantâneo)
```

### 3. Error States Humanizados
```
Ruim:  "Error 503: Service Unavailable"

Bom:   ⚠️  O Gemini está sobrecarregado agora.
           Já estamos tentando pelo DeepSeek... (2/6)
           Isso costuma resolver em segundos.
```

### 4. Progressive Disclosure
```
Nível 1: "Rebanho: 847 cabeças  ↑ 3 esta semana"
Nível 2: [clica] → breakdown por lote, raça, categoria
Nível 3: [clica] → histórico, gráfico 12 meses, alertas
(Usuário vê só o que precisa, pode aprofundar quando quiser)
```

### 5. Confirmação para Ações Destrutivas
```
Usuário clica "Encerrar Lote"
→ Dialog: "Isso marcará 42 animais como vendidos.
           Data de saída: hoje, 22/03/2026.
           [Cancelar]  [Confirmar encerramento]"
```

---

## 📱 DESIGN ESPECÍFICO — AGROMACRO

### Tela Principal (mobile-first)
```
┌─────────────────────────────────┐
│  🐄 AgroMacro        22/03/26  │
│  Fazenda: Antares               │
├─────────────────────────────────┤
│  REBANHO              847 cab.  │
│  ████████████████ 94% ocupado   │
│                                 │
│  GMD MÉDIO            1.2 kg/d  │
│  ↓ Abaixo do esperado (1.4)     │
├─────────────────────────────────┤
│  🤖 Consultar Nexus IA          │
│  "Como melhorar o GMD do Lote B"│
├─────────────────────────────────┤
│ 🐄Rebanho  💰Finan  🌿Pasto  ⚙️ │
└─────────────────────────────────┘
```

### Integração com Nexus IA no AgroMacro
```
Usuário digita: "O lote B está com GMD baixo, o que fazer?"

→ AgroMacro envia pro Nexus:
  {
    prompt: "O lote B está com GMD baixo, o que fazer?",
    contexto: {
      fazenda: "Antares",
      loteB: { cabecas: 120, gmd: 1.2, esperado: 1.4, raca: "Nelore" },
      pastagem: { area: 45, forrageira: "Braquiaria", plu_30d: 89 }
    }
  }

→ Nexus responde com contexto completo da fazenda
  (porque tem o perfil no VidaDigital.json e Knowledge Base)
```

---

## 📱 DESIGN ESPECÍFICO — FRIGOGEST

### Dashboard Principal
```
┌──────────────────────────────────────────────┐
│  🏭 FrigoGest              FG-PRO v2.7.0     │
├──────────────────────────────────────────────┤
│  HOJE: 22/03/2026          Turno: Manhã      │
├────────────┬─────────────┬───────────────────┤
│  Abate     │  Receita    │  Custo/kg         │
│  347 cab.  │  R$ 284k    │  R$ 18,40         │
│  ↑ 12%     │  ↑ 8%       │  ↓ 2% ✅          │
├────────────┴─────────────┴───────────────────┤
│  🤖 AGENTES IA (3 ativos)                    │
│  ● Agente Qualidade      → Análise em curso  │
│  ● Agente Financeiro     → Dentro do limite  │
│  ○ Agente Auditoria      → Aguardando batch  │
├──────────────────────────────────────────────┤
│  ALERTAS                                     │
│  ⚠️  Rendimento Carcaça abaixo de 50% (Lote 7│
│  ✅  Temperatura câmara 3: 2°C (OK)          │
└──────────────────────────────────────────────┘
```

### Fluxo de Aprovação em Cascata (FrigoGest)
```
Agente detecta anomalia
        │
        ▼
┌───────────────────────┐
│  Tier 1: Alerta       │  → Notifica supervisor
│  "Rendimento 48%"     │
└──────────┬────────────┘
           │ sem resposta em 5min
           ▼
┌───────────────────────┐
│  Tier 2: Investigação │  → Agente busca causa
│  Analisa histórico    │     (ração, raça, origem)
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│  Tier 3: Ação         │  → Sugere intervenção
│  "Separar lote 7"     │     com justificativa
└──────────┬────────────┘
           │ aprovação humana
           ▼
┌───────────────────────┐
│  Tier 4: Execução     │  → Registra, notifica, audita
│  Ação implementada    │
└───────────────────────┘
```

---

## 🔧 PADRÕES DE ARQUITETURA APLICADOS

### 1. Event-Driven (AgroMacro)
```javascript
// Cada mudança gera um evento — UI sempre consistente
EventBus.emit('rebanho:atualizado', { lote: 'B', animais: 120 });
EventBus.on('rebanho:atualizado', (data) => {
  atualizarIndicadores(data);
  verificarAlertas(data);
  sincronizarNexus(data); // futuro: envia pro hub
});
```

### 2. Repository Pattern (todos os backends)
```javascript
// Abstrai o banco — pode mudar Supabase por outro sem tocar no service
class RebanhoRepository {
  async findByLote(loteId) { /* Supabase query */ }
  async save(animal) { /* Supabase insert/update */ }
  async getHistorico(meses) { /* Supabase query com range */ }
}

class RebanhoService {
  constructor(repo = new RebanhoRepository()) { this.repo = repo; }
  async calcularGMD(loteId) { /* lógica de negócio */ }
}
```

### 3. Cascade Pattern (aiService.js)
```javascript
// Tenta em ordem, pula se falhar — resiliente por design
async function chamarIAComCascata(prompt, provedores) {
  for (const provedor of provedores) {
    try {
      return await chamarProvedor(provedor, prompt);
    } catch (e) {
      if (e.status === 429 || e.message.includes('quota')) continue;
      throw e; // erro diferente de quota = para
    }
  }
  throw new Error('Todas as IAs falharam');
}
```

### 4. Cache com TTL (nexusService.js)
```javascript
// Evita ler arquivos do disco a cada requisição
const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 minutos

async function carregarKB(arquivo) {
  const cached = cache.get(arquivo);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;
  const data = await fs.readFile(arquivo, 'utf8');
  cache.set(arquivo, { data, ts: Date.now() });
  return data;
}
```

### 5. SSE Streaming Pattern
```javascript
// Resposta token a token — usuário vê IA "pensando"
app.post('/api/nexus/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    await NexusService.processarComandoStream(
      req.body.prompt,
      req.body.historico || [],
      (chunk) => send({ chunk }),        // token a token
    );
    send({ tipo: 'fim' });
    res.end();
  } catch (e) {
    send({ tipo: 'erro', mensagem: e.message });
    res.end();
  }
});
```

---

## 🔩 COMO DESENHAR UM APP COMO O N8N

O n8n é poderoso porque torna **conexões invisíveis visíveis**. O mesmo princípio deve guiar o design do QG IA Ecosystem.

### Princípio 1 — Cada "nó" tem responsabilidade única
```
N8N:      [Trigger] → [HTTP] → [Transform] → [Database]
QG IA:    [Entrada] → [Router] → [Agente] → [Memória] → [Saída]
```

### Princípio 2 — Conexões são explícitas
```
Ruim (implícito):  função A chama função B chama função C (ninguém sabe)
Bom (explícito):   diagramas, logs, status visível em cada etapa
```

### Princípio 3 — Estado sempre visível
```
N8N mostra:       ✅ executado  ⚠️ com erro  ⏳ aguardando
QG IA deve mostrar: qual agente rodou, tempo, IA usada, tokens gastos
```

### Princípio 4 — Replay e debugging
```
N8N permite re-executar um node com os mesmos inputs
QG IA deve:  logar cada chamada com input/output → permite debugar
             auditService já faz isso ✅
```

### Como Implementar Interface Visual tipo N8N para a Fábrica de IA

```
[Usuário digita ideia]
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│  PIPELINE DA FÁBRICA DE IA                                │
│                                                            │
│  ○ Analista ──→ ○ Comandante ──→ ○ Arquiteto              │
│  "Analisando"   "Planejando"    "Desenhando"              │
│                                       │                   │
│                          ┌────────────┘                   │
│                          ▼                                 │
│                    ○ Coder ──→ ○ Auditor ──→ ✅ Entregue  │
│                    "Codando"   "Revisando"               │
└────────────────────────────────────────────────────────────┘
│  Tempo decorrido: 2m 14s  │  IA: DeepSeek  │  84 tokens   │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 MÉTRICAS DE DESIGN QUE IMPORTAM

### Performance (Core Web Vitals)
| Métrica | Alvo | O que mede |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Quanto tempo até o maior elemento aparecer |
| FID (First Input Delay) | < 100ms | Delay do primeiro clique |
| CLS (Cumulative Layout Shift) | < 0.1 | Estabilidade visual (não pula) |
| TTFB (Time to First Byte) | < 600ms | Velocidade do servidor |

### UX Específica de IA
| Métrica | Alvo | O que mede |
|---|---|---|
| Time to First Token | < 1s | Até o primeiro caractere aparecer no stream |
| Streaming Rate | > 20 tokens/s | Velocidade percebida de resposta |
| Error Rate | < 2% | Falhas no cascade de IAs |
| Cascade Fallback Rate | < 15% | Frequência de trocar de IA por quota |

---

## 🎓 PERCURSO DE CARREIRA

### Níveis
1. **Junior UI/UX Designer** (0-2 anos) — Figma, prototipagem, componentes
2. **Mid Frontend + Design** (2-4 anos) — Design systems, acessibilidade, performance
3. **Senior Design & Architecture** (4+ anos) — Decisões de stack, padrões de arquitetura
4. **Principal / Head of Design** — Visão de produto, liderança de time

### Salários EUA
- Junior: $75k - $95k/ano
- Mid: $95k - $130k/ano
- Senior: $130k - $175k/ano
- Principal: $175k - $230k/ano

### Salários Brasil
- Junior: R$ 4k - R$ 7k/mês
- Mid: R$ 7k - R$ 12k/mês
- Senior: R$ 12k - R$ 22k/mês
- Freelance: R$ 200 - R$ 500/hora

---

## 🛠️ Stack de Ferramentas

### Design
- **Figma** — prototipagem, design system, colaboração
- **Storybook** — documentação e teste de componentes
- **Excalidraw** — diagramas rápidos de arquitetura
- **draw.io** — diagramas técnicos formais

### Frontend/Implementação
- **React 19 + TypeScript** — componentes
- **Tailwind CSS** — estilização
- **Framer Motion** — animações
- **Recharts / Victory** — gráficos de dados
- **React Query / TanStack** — estado de servidor

### Arquitetura e Backend
- **Node.js + Express** — APIs
- **Supabase** — banco + auth + realtime
- **Redis** — cache (futuro)
- **BullMQ** — filas de processamento IA (futuro)

---

## 📝 Conclusão

O Design & Architecture Engineer é o profissional que **garante que o sistema funciona como um todo** — não só as partes individuais. No contexto do QG IA Nexus, esse papel é essencial para:

1. **Unificar o visual** — todos os apps com a mesma identidade
2. **Centralizar a inteligência** — QG IA como hub que todos os apps usam
3. **Garantir escalabilidade** — padrões que funcionam com 10x mais dados
4. **Tornar o invisível visível** — o usuário entende o que a IA está fazendo

Sem esse profissional, cada app vira uma ilha — bonito por dentro, desconectado do resto. Com ele, o ecossistema inteiro funciona como um organismo.

---

*Estudo elaborado em março de 2026. Baseado na arquitetura real do QG IA Nexus e apps satélite: FrigoGest, AgroMacro, GESTAO-ANTARES.*
