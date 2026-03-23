# 02 — Mapa do Ecossistema Completo

## Visão geral

```
                    ┌─────────────────────────────────┐
                    │         QG IA NEXUS              │
                    │   (cérebro central do sistema)   │
                    │   qg-ia-nexus.onrender.com        │
                    │                                  │
                    │  20 serviços | 6 IAs em cascade  │
                    │  KB 7 domínios | 15 agentes JSON │
                    └───────────┬──────────────────────┘
                                │ API REST + SSE
            ┌───────────────────┼───────────────────────┐
            │                   │                       │
   ┌────────┴──────┐  ┌─────────┴───────┐   ┌──────────┴────────┐
   │  Fábrica de IA │  │   FrigoGest     │   │   AgroMacro       │
   │ fabrica-ia-api │  │ frigogest-2026  │   │ tmp-repos/AgroMacro│
   │ .onrender.com  │  │ React/TS        │   │ PWA Vanilla JS    │
   │ 11 agentes     │  │ Firebase        │   │ 27+ módulos       │
   │ pipeline 4f    │  │ v2.7.0 ✅       │   │ offline-first     │
   │ ✅ produção    │  │ ⚠️ sem GitHub   │   │ ⚠️ sem deploy     │
   └────────────────┘  └─────────────────┘   └───────────────────┘

   Também no ecossistema:
   ┌─────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
   │  ideiatoapp.me  │  │  GESTAO-ANTARES       │  │  IdeaOrganizer  │
   │  Frontend da    │  │  React/Vite/TS        │  │  Node.js        │
   │  Fábrica de IA  │  │  v0.0.0 incompleto    │  │  embutido no    │
   │  ✅ online      │  │  ⚠️ sem GitHub        │  │  dashboard      │
   └─────────────────┘  └──────────────────────┘  └─────────────────┘
```

---

## Onde cada projeto vive no PC

### Projetos com GitHub (seguros)
| Projeto | Caminho local | GitHub | Produção |
|---------|--------------|--------|----------|
| **qg-ia-nexus** | `C:\Users\Priscila\qg-ia-nexus\` | tportooliveira-alt/qg-ia-nexus | qg-ia-nexus.onrender.com |
| **fabrica-ia-api** | `C:\Users\Priscila\fabrica-ia-api\` | tportooliveira-alt/fabrica-ia-api | fabrica-ia-api.onrender.com |

### Projetos SEM GitHub (risco de perda total)
| Projeto | Caminho local | Ação necessária |
|---------|--------------|----------------|
| **frigogest-2026** | `C:\Users\Priscila\frigogest-2026\` | `gh repo create frigogest-2026 --private` |
| **GESTAO-ANTARES** | `C:\Users\Priscila\tmp-repos\GESTAO-DA-FAZENDA-ANTARES\` | `gh repo create gestao-antares --private` |
| **AgroMacro** | `C:\Users\Priscila\tmp-repos\AgroMacro\` | Verificar se já tem GitHub |
| **IdeaOrganizer** | `C:\Users\Priscila\IdeaOrganizer\` | Verificar se já tem GitHub |
| **whatsapp-claude-bot** | `C:\Users\Priscila\tmp-repos\whatsapp-claude-bot\` | `gh repo create` |

### Duplicatas (deletar após confirmar GitHub)
| Lixo | Versão real | Ação |
|------|------------|------|
| `Desktop\QG-IA-NOVO\` | `qg-ia-nexus\` no GitHub | Deletar |
| `tmp-repos\fabrica-ia-api\` (v2.0.0) | `fabrica-ia-api\` (v3.0.0) | Deletar |
| `TUDO_PARA_BACKUP\Projetos\AgroMacro\` | `tmp-repos\AgroMacro\` | Deletar |
| `TUDO_PARA_BACKUP\Projetos\fazenda-cerebro\` | `tmp-repos\fazenda-cerebro\` | Deletar |

### Arquivos soltos (lixo na raiz do PC)
| Arquivo | Onde | Ação |
|---------|------|------|
| `server.js` | `C:\Users\Priscila\` | Deletar (cópia velha) |
| `package-lock.json` | `C:\Users\Priscila\` | Deletar |
| `teste-claude.js` | `C:\Users\Priscila\` | Deletar |
| `public\` (pasta) | `C:\Users\Priscila\` | Deletar |

---

## Arquivos JS soltos na raiz do qg-ia-nexus (mover ou integrar)

| Arquivo | O que é | Destino |
|---------|---------|---------|
| `auto_evolve.js` | Script que chama ResearchService manualmente | Mover para `scripts/` |
| `explorer.js` | Agente Explorador Técnico (busca web de IAs) | Integrar como skill em `src/skills/` |
| `governance.js` | Frontend JS para aprovações (parte do dashboard) | Mover para `src/js/` ou reescrever em React |
| `vidente.js` | Agente Vidente — analisa sistema de 2 ângulos | Integrar como skill em `src/skills/` |
| `skills_data.js` | Pack de skills para import no browser | Mover para `src/skills/` |
| `ui_settings.js` | Frontend JS para configurações do dashboard | Mover para `src/js/` ou reescrever em React |
| `list_gemini_models.js` | Script utilitário para listar modelos | Mover para `scripts/` |
| `server_HOSTINGER.js` | Versão antiga do server para Hostinger | Deletar (obsoleto, usando Render) |
| `server_hostinger_entry.js` | Entry point antigo Hostinger | Deletar (obsoleto) |
| `supabase_tabelas_faltando.sql` | SQL de criação de tabelas | Mover para `database/migrations/` |
| `index_HOSTINGER.html` | Versão antiga do frontend | Deletar (obsoleto) |
| `auto_evolve.js` | Runner manual do ResearchService | Mover para `scripts/` |

---

## Projetos satélite — estado detalhado

### FrigoGest (frigogest-2026)
- **Stack:** React/TypeScript + Firebase
- **Versão:** v2.7.0
- **Funcionalidade:** Gestão de frigorífico — 16 agentes IA em 5 tiers
- **5 Tiers:** Recepção → Inspeção → Abate → Processamento → Expedição
- **Estado:** Funcional mas SEM GitHub — risco de perda total
- **Documentos encontrados:** DEEP_ANALYSIS_AUDIT.md, PADRAO_ESTORNO_BLINDADO.md, PLANO_MIGRACAO_SUPABASE.md
- **Próximo passo:** Criar repo GitHub URGENTE

### AgroMacro
- **Stack:** PWA Vanilla JS, offline-first
- **Funcionalidade:** 27+ módulos — rebanho, pasto, financeiro, rastreabilidade, IA consultora
- **Disciplinas:** App.js, assets, docs, firebase.json, manifest, sw.js (PWA completo)
- **Estado:** Funcional localmente, sem deploy de produção
- **Diferencial:** Funciona 100% offline (campo sem internet)

### GESTAO-DA-FAZENDA-ANTARES
- **Stack:** React/TypeScript + Vite
- **Versão:** v0.0.0 (incompleto)
- **Estrutura:** App.tsx, components/, services/, types.ts — início de uma gestão de fazenda
- **Estado:** Apenas estrutura inicial, sem funcionalidade completa
- **Decisão:** Absorver o que está pronto no AgroMacro (evitar dois projetos fazenda)

### IdeaOrganizer
- **Stack:** Node.js (server/)
- **Estado:** Funcional, embutido no dashboard do Nexus
- **Decisão:** Manter embutido ou transformar em módulo do QG v2

---

## Segurança — URGENTE

```
🔴 C:\Users\Priscila\Desktop\QG-IA-NOVO\GEMINI_API_KEY=AIzaSyD20IBqyZ4IlNSn.txt
   Contém: Gemini, Groq, DeepSeek keys em texto puro
   Qualquer pessoa com acesso ao PC pode ler

AÇÃO:
1. Copiar chaves para .env de cada projeto
2. Deletar o arquivo .txt AGORA
3. Confirmar que .gitignore inclui .env em todos os projetos
```
