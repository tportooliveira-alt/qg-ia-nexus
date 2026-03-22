# ESTUDO: Prompt Engineer & AI Application Designer

## 📋 Visão Geral

O **Prompt Engineer & AI Application Designer** é um dos papéis mais estratégicos da era de IA. Ele atua na ponte entre o criador (quem tem a ideia) e o sistema de IA (quem vai executar). Seu trabalho é duplo:

1. **Ouvir o criador** com profundidade cirúrgica — extrair cada intenção, cada detalhe, cada passo que o criador às vezes não sabe verbalizar — e transformar isso em prompts precisos.
2. **Desenhar o aplicativo completo** — mapear visualmente o fluxo inteiro: quais agentes existem, o que cada um faz, como se conectam, onde entra dado humano, onde a IA age sozinha. Igual ao n8n faz com automações, mas para sistemas de IA.

**Este profissional não é só quem "escreve prompts bem escritos". É quem projeta o cérebro do sistema.**

---

## 🎯 Responsabilidades Principais

### Como Ouvidor do Criador
- **Entrevista de descoberta:** Extrair a visão real do criador através de perguntas cirúrgicas (o criador sabe o que quer, mas raramente sabe descrever com precisão técnica)
- **Decomposição de intenção:** Quebrar uma ideia grande ("quero um app de fazenda inteligente") em etapas menores, ordenadas, com entrada e saída claras em cada uma
- **Validação de suposições:** Perguntar o que não foi dito — regras de negócio implícitas, casos de borda, prioridades ocultas
- **Documentação estruturada:** Registrar tudo em formato que tanto humanos quanto IAs consigam entender (especificações de agente, persona, contexto, restrições)

### Como Designer de Aplicações IA
- **Mapeamento de fluxo:** Desenhar o app como um diagrama — entradas, saídas, decisões, loops, agentes
- **Design de agentes:** Definir quantos agentes, qual é o papel de cada um, quais ferramentas cada um usa
- **Orquestração:** Projetar quem chama quem, quando a IA age sozinha vs. quando pede aprovação humana
- **Gestão de contexto:** Decidir o que cada agente precisa saber, o que deve ir para memória, o que é descartável
- **Prototipagem rápida:** Construir um fluxo funcional mínimo antes de partir para código

### Como Prompt Engineer
- **Prompts de sistema:** Escrever o "cérebro" de cada agente — persona, objetivo, restrições, estilo de resposta
- **Prompts de tarefa:** Instruções precisas para tarefas específicas — com exemplos, formato de saída, critérios de sucesso
- **Prompts de avaliação:** Prompts que avaliam a saída de outros prompts (LLM-as-judge)
- **Chain-of-thought:** Estruturar raciocínio em cadeia para tarefas complexas
- **Few-shot design:** Criar exemplos que calibram o comportamento do modelo
- **Iteração e refinamento:** Testar, medir resultado, ajustar — ciclo científico de melhoria

---

## 🛠️ Tecnologias e Ferramentas

### Ferramentas de Design de Fluxo (como n8n)
- **n8n** — automação visual de workflows, suporte a agentes IA
- **LangGraph** — grafos de estados para agentes com memória e loops
- **LangFlow** — interface visual para pipelines LangChain
- **Flowise** — drag-and-drop para fluxos de agentes
- **Make (Integromat)** — automações visuais com suporte a IA
- **Zapier AI** — automações com reasoning dinâmico

### Frameworks de Agentes
- **LangChain** — orquestração de cadeia de chamadas de IA
- **CrewAI** — multi-agentes com papéis definidos, como equipe humana
- **AutoGen (Microsoft)** — agentes conversacionais em paralelo
- **Claude Agent SDK (Anthropic)** — agentes com ferramentas e streaming
- **OpenAI Assistants API** — agentes com memória e ferramentas nativas

### Ferramentas de Prompt Engineering
- **PromptLayer** — versionamento e rastreamento de prompts
- **LangSmith** — observabilidade de pipelines LangChain
- **Weights & Biases (W&B)** — rastreamento de experimentos de prompts
- **Helicone** — monitoramento de chamadas de API de IA
- **PromptFlow (Azure)** — ciclo completo de desenvolvimento de prompts

### Modelos de IA Utilizados
- **Claude (Anthropic)** — raciocínio profundo, instruções longas, análise
- **GPT-4o / o3 (OpenAI)** — raciocínio, visão, multimodal
- **Gemini Pro / Ultra (Google)** — contexto longo, multimodal
- **Groq / Cerebras** — inferência ultra-rápida (latência baixa)
- **DeepSeek / Mistral** — modelos eficientes para tarefas específicas
- **Llama 3 (Meta)** — modelos abertos para fine-tuning local

### Ferramentas de Documentação Visual
- **Miro** / **FigJam** — mapas mentais e fluxos de agentes
- **Excalidraw** — diagramas rápidos e informais
- **Lucidchart** / **draw.io** — diagramas técnicos formais
- **Notion** — documentação de specs de agentes

---

## 📊 Habilidades Técnicas Essenciais

### Hard Skills
- Escrita de prompts de sistema completos (persona + objetivo + restrições + formato)
- Decomposição de problemas complexos em etapas sequenciais
- Design de fluxos de agentes (quem chama quem, qual dado passa adiante)
- Conhecimento de arquiteturas: RAG, agentes com ferramentas, multi-agentes, memória vetorial
- Avaliação quantitativa de prompts (métricas de qualidade, LLM-as-judge)
- Leitura e escrita de JSON/YAML para configuração de agentes
- Noção de APIs REST e webhooks (para integração com n8n e similares)
- Fundamentos de embeddings e busca vetorial (para memória e RAG)

### Soft Skills — O MAIS IMPORTANTE DESTA CARREIRA
- **Escuta ativa e profunda:** Ouvir o que o criador diz E o que ele não diz
- **Perguntas cirúrgicas:** Saber qual pergunta destrinca a intenção real
- **Empatia com o usuário final:** Pensar em quem vai usar o sistema, não só em quem pediu
- **Pensamento sistêmico:** Ver o todo antes de detalhar as partes
- **Comunicação clara:** Explicar o design do sistema para não-técnicos
- **Paciência iterativa:** Bons prompts raramente surgem na primeira tentativa

---

## 🔬 O Processo de Trabalho (Como Funciona na Prática)

### Passo 1 — Sessão de Descoberta com o Criador
O designer senta com o criador e faz perguntas até extrair:
- **O que o sistema faz?** (objetivo final)
- **Quem usa?** (persona do usuário)
- **Qual dado entra?** (inputs: texto, voz, imagem, planilha)
- **Qual dado sai?** (outputs: relatório, ação, mensagem, decisão)
- **Onde a IA age sozinha e onde o humano decide?** (nível de autonomia)
- **O que nunca pode dar errado?** (casos críticos, regras de negócio)

### Passo 2 — Design Visual do App (Como o n8n)
Desenha em um quadro (Miro, Excalidraw ou papel):
```
[Usuário]
    ↓ mensagem de texto
[Agente de Intenção] → detecta: financeiro? técnico? pessoal?
    ↓ roteamento por domínio
[Agente Especialista] → responde com contexto da knowledge base
    ↓ resposta
[Agente de Qualidade] → valida se a resposta está correta e no tom certo
    ↓ aprovado
[Usuário recebe resposta]
```

### Passo 3 — Especificação de Cada Agente
Para cada nó do diagrama, escreve:
- **Nome e papel:** "Agente de Intenção — detecta o domínio da pergunta"
- **Prompt de sistema:** persona completa + instruções + exemplos
- **Ferramentas disponíveis:** busca no Supabase, chamada de API, envio de email
- **Regras de saída:** formato JSON esperado, campos obrigatórios
- **Critério de falha:** quando escalar para humano ou tentar de novo

### Passo 4 — Implementação dos Prompts
Escreve os prompts e testa com casos reais:
```
SISTEMA: Você é o Agente de Intenção do QG IA.
Seu único trabalho é ler a mensagem do usuário e classificar
em exatamente um dos domínios: [financeiro, técnico, pessoal, urgente].
Responda SOMENTE em JSON: {"dominio": "...", "confianca": 0.0-1.0, "motivo": "..."}
Nunca responda nada além do JSON.

EXEMPLOS:
- "quanto gastei esse mês?" → {"dominio": "financeiro", "confianca": 0.95, "motivo": "pergunta sobre gastos"}
- "meu servidor caiu" → {"dominio": "técnico", "confianca": 0.98, "motivo": "problema de infraestrutura"}
```

### Passo 5 — Iteração e Calibração
- Testa com 20-50 inputs reais
- Mede taxa de acerto, tom, formato
- Ajusta o prompt onde falhou
- Documenta o que funcionou e por quê

---

## 🎓 Percurso de Carreira

### Níveis Típicos
1. **Junior Prompt Engineer** (0-1 ano)
   - Escreve prompts seguindo templates existentes
   - Testa e mede resultados
   - Aprende arquiteturas básicas de agentes

2. **Mid Prompt Engineer** (1-3 anos)
   - Design de fluxos completos de até 5 agentes
   - Escolhe a stack certa para cada problema
   - Lidera sessões de descoberta com clientes

3. **Senior AI Application Designer** (3+ anos)
   - Arquiteta sistemas multi-agentes complexos
   - Define padrões e frameworks internos da empresa
   - Avalia build vs. buy de ferramentas de IA
   - Mentora times sobre prompt engineering

4. **Principal / Head of AI Design**
   - Visão estratégica de como IA transforma produtos
   - Interface entre C-level e times técnicos
   - Define roadmap de capabilities de IA da empresa

---

## 💰 Salários (2024-2026)

### EUA
- **Junior:** $85k - $110k/ano
- **Mid:** $110k - $145k/ano
- **Senior:** $145k - $200k/ano
- **Principal / Head:** $200k - $300k+/ano

### Brasil
- **Junior:** R$ 5k - R$ 8k/mês
- **Mid:** R$ 8k - R$ 15k/mês
- **Senior:** R$ 15k - R$ 25k/mês
- **Freelance/Consultoria:** R$ 300 - R$ 800/hora

> **Nota:** Esta carreira está em formação acelerada. Profissionais com portfólio sólido de sistemas IA em produção negociam valores acima da tabela.

---

## 🏗️ Padrões de Arquitetura que Este Profissional Domina

### 1. Agente Simples com Ferramentas
```
[Usuário] → [Agente] → [Ferramentas: busca, API, banco] → [Resposta]
```
Ideal para: assistentes de atendimento, bots de suporte

### 2. Pipeline Sequential (Cascata)
```
[Input] → [Agente A] → [Agente B] → [Agente C] → [Output]
```
Ideal para: análise → redação → revisão (como a Fábrica de IA)

### 3. Roteamento por Domínio
```
[Input] → [Router] → [Agente Financeiro]
                   → [Agente Técnico]
                   → [Agente Jurídico]
```
Ideal para: sistemas gerais que atendem múltiplos contextos (como o QG IA)

### 4. Multi-Agente Paralelo
```
[Input] → [Agente 1] ─┐
         [Agente 2] ─→ [Agente Agregador] → [Output]
         [Agente 3] ─┘
```
Ideal para: análises que precisam de múltiplas perspectivas simultaneamente

### 5. Loop com Validação Humana
```
[Input] → [Agente] → [Output] → [Humano aprova?]
                                    ↓ não
                               [Agente refina]
                                    ↓ sim
                               [Output Final]
```
Ideal para: sistemas de alto risco onde erro é custoso

### 6. RAG (Retrieval-Augmented Generation)
```
[Pergunta] → [Busca na Knowledge Base] → [Contexto relevante]
                                              ↓
                                    [Agente responde com contexto]
```
Ideal para: assistentes que precisam de informação específica e atualizada

---

## 🔴 Erros Mais Comuns (e Como Evitar)

| Erro | Consequência | Como Evitar |
|---|---|---|
| Prompt vago demais | IA alucina ou divaga | Sempre especificar formato de saída |
| Contexto longo demais | IA "esquece" partes | Usar RAG + memória seletiva |
| Um agente faz tudo | Sistema frágil e difícil de debugar | Dividir em agentes com responsabilidade única |
| Não testar casos de borda | Falhas em produção | Criar suite de testes com inputs difíceis |
| Não versionar prompts | Impossível regredir se piorar | Usar PromptLayer ou git para prompts |
| Pular sessão de descoberta | Construir a coisa errada | Sempre entrevistar o criador antes de escrever uma linha |

---

## 📈 Tendências Futuras (2025-2030)

### O que está chegando
- **Prompts visuais:** Arrastar e conectar componentes de prompt sem escrever texto
- **Auto-prompt (meta-prompting):** IAs que otimizam seus próprios prompts automaticamente
- **Agentes com memória episódica:** Sistemas que lembram de conversas passadas e evoluem
- **Multimodal native:** Prompts que combinam texto, imagem, voz e vídeo nativamente
- **Ferramentas de avaliação automatizada:** Benchmarks automáticos de qualidade de prompts
- **Agentes soberanos:** Sistemas que rodam offline, com dados proprietários protegidos

### Habilidades que valorizam mais
- Fine-tuning de modelos com dados proprietários
- Avaliação rigorosa (métricas, evals, red teaming)
- Segurança de prompts (prompt injection, jailbreak prevention)
- Design de sistemas multi-agentes de larga escala
- Integração com ferramentas visuais (n8n, LangFlow, Flowise)

---

## 💡 Diferencial Competitivo Real

O que separa um **Prompt Engineer mediano** de um **AI Application Designer de elite**:

| Mediano | Elite |
|---|---|
| Escreve prompts quando pedido | Propõe a arquitetura antes de qualquer código |
| Testa manualmente | Mede com métricas e itera sistematicamente |
| Conhece 1-2 ferramentas | Escolhe a ferramenta certa para cada problema |
| Foca no prompt individual | Pensa no sistema inteiro |
| Precisa que o criador explique tudo | Extrai o que o criador não sabe que precisa dizer |
| Entrega prompts | Entrega sistemas funcionando em produção |

---

## 🏢 Contextos de Trabalho

### Startups de IA
- Papéis multidisciplinares — design + engenharia + pesquisa
- Iteração rápida, aprendizado acelerado
- Impacto direto no produto

### Empresas Tradicionais em Transformação
- Foco em automação de processos legados
- Integração com sistemas existentes (SAP, ERP, CRM)
- Ciclos mais longos, mais documentação

### Consultoria / Freelance
- Projetos variados, múltiplas indústrias
- Alto valor por hora (R$ 300-800/h no Brasil)
- Requer portfólio sólido e capacidade de vender o trabalho

### Produto Próprio
- Construir sistemas IA próprios e monetizar
- Maior risco, maior retorno
- Exemplos: Fábrica de IA, assistentes verticais, ferramentas no-code

---

## 🔍 Diferença Entre Papéis Próximos

| Papel | Foco | Não Faz |
|---|---|---|
| **Prompt Engineer puro** | Escreve e otimiza prompts | Não projeta o sistema inteiro |
| **ML Engineer** | Treina e fine-tuna modelos | Não foca em produto/UX |
| **AI Application Designer** (este estudo) | Projeta o sistema + escreve prompts + ouve o criador | Não treina modelos do zero |
| **AI Product Manager** | Define o que construir | Não sabe como implementar |
| **Full-stack IA** | Implementa código completo | Não é especialista em prompts |

**O AI Application Designer é o papel que conecta todos os outros.**

---

## 📝 Conclusão

Este é o papel mais estratégico da era de IA porque resolve o problema mais difícil: **a distância entre o que o criador imagina e o que o sistema entrega.**

Qualquer empresa que usa IA sem um profissional com este perfil está construindo sistemas sem arquitetura — o equivalente a construir uma casa sem planta. O resultado é sempre retrabalho, confusão e sistemas que não funcionam como esperado.

Com um AI Application Designer no time:
- O criador se sente ouvido e entendido
- O sistema é desenhado antes de ser construído
- Cada agente tem propósito claro e métricas de sucesso
- O app evolui de forma previsível e controlada

---

## 🌍 As Melhores Técnicas de Prompt do Mundo

Pesquisa das técnicas mais poderosas, validadas por laboratórios de IA de elite (Google, Anthropic, OpenAI, Stanford, Princeton). Cada uma com: o que é, quando usar, e exemplo prático.

---

### 1. Chain-of-Thought (CoT) — Google DeepMind, 2022
**O que é:** Pedir para a IA mostrar o raciocínio passo a passo antes de dar a resposta final. Aumenta drasticamente a precisão em tarefas complexas.

**Quando usar:** Matemática, lógica, análise financeira, diagnósticos — qualquer coisa onde a resposta depende de múltiplas etapas.

**Exemplo:**
```
Analise o fluxo de caixa desta fazenda e diga se o mês foi lucrativo.
Pense passo a passo:
1. Liste todas as entradas do mês
2. Liste todas as saídas do mês
3. Calcule o saldo
4. Conclua se foi lucrativo ou não e por quê
```
**Resultado:** A IA não pula para uma resposta errada — ela raciocina como um humano faria.

---

### 2. Tree of Thoughts (ToT) — Princeton + Google, 2023
**O que é:** Em vez de um caminho único de raciocínio, a IA explora múltiplos caminhos em paralelo e escolhe o melhor. É CoT elevado ao cubo.

**Quando usar:** Decisões estratégicas, problemas com múltiplas soluções possíveis, planejamento de produto.

**Exemplo:**
```
Você precisa decidir qual stack usar para o FrigoGest.
Explore 3 caminhos diferentes:
- Caminho A: React + Supabase (considere pros e contras)
- Caminho B: Next.js + PostgreSQL próprio (considere pros e contras)
- Caminho C: React Native + Firebase (considere pros e contras)
Depois de explorar os 3, escolha o melhor e justifique.
```

---

### 3. ReAct (Reasoning + Acting) — Google, 2022
**O que é:** O agente raciocina (Thought), age (Action) e observa o resultado (Observation) em ciclos. É o padrão base da maioria dos agentes modernos.

**Quando usar:** Agentes que precisam usar ferramentas — busca na web, banco de dados, APIs — e decidir a cada passo o que fazer.

**Exemplo:**
```
Thought: O usuário quer saber o preço atual do boi gordo. Preciso buscar essa informação.
Action: buscar("preço boi gordo hoje Brasil")
Observation: R$ 320,00 a arroba, alta de 2% na semana.
Thought: Tenho a informação. Posso responder agora.
Action: responder("O boi gordo está a R$ 320/arroba, subiu 2% esta semana.")
```

---

### 4. Self-Consistency — Google, 2022
**O que é:** Gerar múltiplas respostas para a mesma pergunta com raciocínios diferentes, depois escolher a resposta mais consistente entre elas (por votação ou agregação).

**Quando usar:** Quando precisar de alta confiabilidade. Perfeito para análises críticas onde um erro tem custo alto.

**Exemplo:**
```
Responda esta pergunta 5 vezes usando raciocínios diferentes.
Depois, diga qual resposta apareceu mais vezes e por quê ela é a mais confiável.
Pergunta: Vale a pena expandir o rebanho da Fazenda Antares agora?
```

---

### 5. Few-Shot Prompting — OpenAI (GPT-3 paper, 2020)
**O que é:** Dar exemplos de entrada/saída antes de fazer a pergunta real. A IA aprende o padrão pelos exemplos e aplica na nova situação.

**Quando usar:** Sempre que quiser um formato de saída específico ou comportamento consistente. É o mais usado na prática.

**Exemplo:**
```
Classifique a mensagem em: [urgente] [normal] [ignorar]

Mensagem: "o servidor caiu e clientes não conseguem acessar" → [urgente]
Mensagem: "quando vai ter nova versão do app?" → [normal]
Mensagem: "oi tudo bem?" → [ignorar]

Agora classifique: "o Pix está falhando desde às 14h"
```
**Resultado:** `[urgente]` — sem precisar explicar o critério, os exemplos já ensinam.

---

### 6. Zero-Shot Prompting — OpenAI, 2020
**O que é:** Dar apenas a instrução, sem exemplos. Funciona bem com modelos grandes e tarefas que têm linguagem natural clara.

**Quando usar:** Tarefas simples ou quando não há exemplos disponíveis. Mais rápido, mas menos confiável que few-shot.

**Exemplo:**
```
Resuma este contrato em 3 pontos principais, em linguagem simples para um fazendeiro.
```

---

### 7. Constitutional AI Prompting — Anthropic, 2022
**O que é:** Definir princípios (uma "constituição") que a IA deve seguir ao responder. A IA auto-avalia suas respostas contra esses princípios antes de entregar.

**Quando usar:** Sistemas que precisam de comportamento seguro, ético e consistente — atendimento ao cliente, sistemas financeiros, saúde.

**Exemplo:**
```
PRINCÍPIOS QUE VOCÊ DEVE SEGUIR:
1. Nunca dar conselho financeiro como se fosse certeza — sempre dizer "com base nos dados disponíveis"
2. Nunca mencionar concorrentes pelo nome
3. Se não souber a resposta, diga claramente que não sabe em vez de inventar
4. Sempre perguntar se o usuário entendeu antes de encerrar

Agora responda: [pergunta do usuário]
```

---

### 8. Skeleton-of-Thought — Microsoft Research, 2023
**O que é:** Gerar primeiro o esqueleto da resposta (tópicos principais), depois preencher cada parte em paralelo. Reduz latência e melhora organização.

**Quando usar:** Geração de documentos longos, relatórios, planos de negócio — onde estrutura importa tanto quanto conteúdo.

**Exemplo:**
```
Passo 1: Liste os 5 tópicos principais que uma análise de viabilidade do AgroMacro deve ter.
[IA gera o esqueleto]

Passo 2: Agora escreva cada tópico em detalhes, mantendo a estrutura acima.
```

---

### 9. Meta-Prompting — Stanford, 2024
**O que é:** Um prompt que instrui a IA a gerar o prompt ideal para uma tarefa, e depois executar esse prompt. A IA cria sua própria instrução.

**Quando usar:** Quando você não sabe exatamente como formular o prompt, ou quer que a IA otimize a abordagem automaticamente.

**Exemplo:**
```
Você é um especialista em prompt engineering.
Sua tarefa: criar o prompt perfeito para um agente que analisa saúde financeira de fazendas.
Considere: qual persona o agente deve ter, que dados ele precisa receber, em que formato deve responder.
Escreva o prompt ideal e depois execute ele com estes dados: [dados da fazenda]
```

---

### 10. Role Prompting + Persona Injection — Amplamente usado, 2021+
**O que é:** Dar à IA um papel específico e detalhado. Quanto mais rica a persona, mais consistente e especializado o comportamento.

**Quando usar:** Sempre. É a base de qualquer bom prompt de sistema. Um agente sem persona clara é genérico e inconsistente.

**Exemplo fraco:**
```
Você é um assistente financeiro.
```

**Exemplo poderoso:**
```
Você é o Nexus Claw — CFO pessoal da Priscila, com 20 anos de experiência em
agronegócio e startups de tecnologia no Brasil. Você conhece cada projeto dela
(AgroMacro, FrigoGest, QG IA) e pensa como um sócio estratégico, não como um
assistente. Você fala direto, sem enrolação, e sempre termina com uma próxima
ação concreta. Quando não souber algo, pesquisa antes de responder.
```

---

### 11. Prompt Chaining — Padrão LangChain, 2022+
**O que é:** A saída de um prompt vira a entrada do próximo. Cada etapa faz uma coisa bem, em vez de um prompt fazer tudo mal.

**Quando usar:** Pipelines complexos — análise → decisão → ação → relatório. É o coração da Fábrica de IA.

**Exemplo (pipeline de análise de negócio):**
```
Prompt 1 → "Extraia os dados financeiros desta mensagem: [texto do usuário]"
  ↓ saída: JSON com receita, custo, lucro
Prompt 2 → "Com base nestes dados [JSON], identifique os 3 maiores riscos"
  ↓ saída: lista de riscos
Prompt 3 → "Para cada risco identificado [lista], sugira uma ação preventiva concreta"
  ↓ saída: plano de ação
```

---

### 12. Least-to-Most Prompting — Google, 2022
**O que é:** Decompor o problema em subproblemas do mais simples ao mais complexo. Resolver cada um em ordem, usando as respostas anteriores.

**Quando usar:** Problemas difíceis que parecem impossíveis diretamente, mas ficam simples quando quebrados em partes.

**Exemplo:**
```
Vamos resolver passo a passo, do mais simples ao mais complexo:
1. Primeiro: qual é o custo por cabeça de gado por mês?
2. Depois: qual é a receita média por cabeça?
3. Agora: qual é o breakeven do rebanho atual?
4. Finalmente: quantas cabeças precisamos para atingir R$ 50k/mês de lucro?
```

---

### Tabela Comparativa Rápida

| Técnica | Melhor Para | Complexidade | Custo de Tokens |
|---|---|---|---|
| Zero-Shot | Tarefas simples | Baixa | Baixo |
| Few-Shot | Formato específico | Baixa | Médio |
| Chain-of-Thought | Raciocínio lógico | Média | Médio |
| ReAct | Agentes com ferramentas | Alta | Alto |
| Tree of Thoughts | Decisões estratégicas | Alta | Muito alto |
| Self-Consistency | Alta confiabilidade | Alta | Muito alto |
| Role/Persona | Todo sistema de agente | Baixa | Baixo |
| Prompt Chaining | Pipelines complexos | Média | Médio |
| Constitutional AI | Sistemas críticos/seguros | Média | Médio |
| Meta-Prompting | Auto-otimização | Alta | Alto |

---

*Estudo elaborado em março de 2026. Referências: Anthropic, LangChain, CrewAI, n8n, OpenAI, Google DeepMind, Stanford HAI, Princeton NLP, Microsoft Research.*
