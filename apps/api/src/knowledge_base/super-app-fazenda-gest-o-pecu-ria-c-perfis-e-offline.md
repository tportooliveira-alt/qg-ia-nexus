---
name: "Super-App Fazenda: Gestão Pecuária c/ Perfis e Offline"
description: "Unifica AgroMacro, FrigoGest e Fazenda Cérebro em um Super-App offline-first para pecuária de corte. Oferece dashboards personalizados por perfil (mensalista, diarista, empreiteiro, gerente/chefe), permitindo registro de manejos, contagem de animais, tratamentos e custos operacionais no campo, mesmo sem internet. Aborda a falta de controle, rastreabilidade e a dependência do conhecimento individual, otimizando a produtividade da cria, recria e engorda a pasto/semiconfinamento."
---

# Contexto e Objetivo
Esta diretriz estrutural foi criada no IdeaOrganizer para o projeto **Startup IA**.
Use este arquivo de skill para formatar, planejar e executar o desenvolvimento baseado nestes parâmetros.

## Descrição Principal
Unifica AgroMacro, FrigoGest e Fazenda Cérebro em um Super-App offline-first para pecuária de corte. Oferece dashboards personalizados por perfil (mensalista, diarista, empreiteiro, gerente/chefe), permitindo registro de manejos, contagem de animais, tratamentos e custos operacionais no campo, mesmo sem internet. Aborda a falta de controle, rastreabilidade e a dependência do conhecimento individual, otimizando a produtividade da cria, recria e engorda a pasto/semiconfinamento.

## Detalhes / Requisitos
- Implementação como PWA robusto com IndexedDB/localStorage para funcionalidade offline completa e sincronização inteligente com Supabase ao detectar conexão.
- Sistema de controle de acesso baseado em perfis (RBAC) para granularidade nas permissões e visualizações de dados.
- Flexibilidade na gestão de rebanho: por lotes (com média de arrobas) e opção para registro individualizado, ou por 'mini-fichas' de animais conhecidos por características visuais.
- Módulo de registro de manejo de pastagem e contagem de animais offline com alertas automáticos para o gerente em caso de inconsistências.
- Funcionalidade de registro de tratamentos e eventos individuais dentro de lotes, com histórico visual via fotos/descrições para animais 'conhecidos'.
- Registro de custos operacionais pelos vaqueiros (via 'mini-requisições' de insumos) para alimentar o fluxo de caixa indiretamente.
- Integração com Fazenda Cérebro (IA) para estimar ganho de peso diário por lote, prever data ideal de abate e sugerir rotações de pastagem dinâmicas.
- Geração de relatórios e dashboards estratégicos para o gerente/chefe sobre performance de lotes, custos operacionais e métricas de produtividade, sem incluir o fluxo de caixa direto.

## Próximos Passos Sugeridos
1. Analista de Produto: Criar o PRD detalhado especificando as interfaces e fluxos para cada perfil (mensalista, diarista, empreiteiro, gerente/chefe), com foco nas funcionalidades offline.
2. Arquiteto: Projetar o modelo de dados para suportar a gestão por lotes e individual, e definir a arquitetura de sincronização offline-first com o Supabase.
3. Scout de Mercado: Aprofundar a pesquisa em softwares de gestão de pecuária de corte, com foco em cria, recria e engorda (especialmente a pasto), identificando melhores práticas de manejo, controle de custos e funcionalidades de rastreabilidade.
4. Engenheiro: Iniciar o boilerplate para um PWA offline-first utilizando HTML, Vanilla JS, Tailwind e Node.js/Express.

## Escopo Técnico / Tags
`pecuaria-corte` `offline-first` `super-app` `rbac` `ia-agro` `gestao-rebanho` `custos-operacionais` `pwa` `supabase`
