# 08 — Design System

## Filosofia

Dark-first. Densidade informacional alta. Glow para IA ativa.
O design deve comunicar que o sistema está pensando e trabalhando.

---

## Cores (CSS Custom Properties)

```css
:root {
  /* BASE */
  --color-bg-base:       #0A0A0F;   /* fundo total — quase preto azulado */
  --color-bg-surface:    #0D0D1F;   /* cards, painéis */
  --color-bg-elevated:   #13132A;   /* modais, dropdowns */
  --color-bg-hover:      #1A1A3A;   /* hover states */

  /* PRIMÁRIA — Roxo (identidade IA) */
  --color-primary-300:   #C4B5FD;
  --color-primary-400:   #A78BFA;   /* destaques, links */
  --color-primary-500:   #7C3AED;   /* botões, ações principais */
  --color-primary-600:   #6D28D9;   /* hover de botões */
  --color-primary-glow:  rgba(124, 58, 237, 0.25);

  /* ACENTO — Ciano (dados, analytics) */
  --color-accent-400:    #22D3EE;   /* badges de dados, métricas */
  --color-accent-500:    #06B6D4;
  --color-accent-glow:   rgba(34, 211, 238, 0.2);

  /* TEXTO */
  --color-text-primary:  #E2E8F0;   /* texto principal */
  --color-text-secondary:#94A3B8;   /* texto de suporte */
  --color-text-muted:    #64748B;   /* desabilitado, placeholder */
  --color-text-accent:   #A78BFA;   /* links, destaques */

  /* BORDAS */
  --color-border:        rgba(255, 255, 255, 0.08);
  --color-border-active: rgba(124, 58, 237, 0.5);
  --color-border-subtle: rgba(255, 255, 255, 0.04);

  /* SEMÂNTICAS */
  --color-success:       #22C55E;
  --color-warning:       #F59E0B;
  --color-error:         #F87171;
  --color-info:          #38BDF8;

  /* SOMBRAS */
  --shadow-sm:           0 1px 3px rgba(0, 0, 0, 0.5);
  --shadow-md:           0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-glow-primary: 0 0 20px rgba(124, 58, 237, 0.3);
  --shadow-glow-accent:  0 0 20px rgba(34, 211, 238, 0.3);
}
```

---

## Tipografia

```css
:root {
  --font-sans:  'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:  'JetBrains Mono', 'Fira Code', monospace;

  /* Escala (base 4px) */
  --text-xs:   0.75rem;    /* 12px — badges, labels */
  --text-sm:   0.875rem;   /* 14px — texto secundário */
  --text-base: 1rem;       /* 16px — corpo */
  --text-lg:   1.125rem;   /* 18px — subtítulos */
  --text-xl:   1.25rem;    /* 20px — títulos de seção */
  --text-2xl:  1.5rem;     /* 24px — títulos de página */
  --text-3xl:  1.875rem;   /* 30px — números grandes */

  /* Pesos */
  --weight-regular:    400;
  --weight-medium:     500;   /* botões, labels */
  --weight-semibold:   600;   /* subtítulos */
  --weight-bold:       700;   /* títulos */
}
```

---

## Espaçamento (base 4px)

```css
:root {
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;   /* mais usado internamente */
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Raios */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-full: 9999px;

  /* Transições */
  --transition-fast:   150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow:   400ms ease;
}
```

---

## Componentes (comportamento esperado)

### Button
```
Primary:  bg-primary-500, hover: bg-primary-600, active: scale(0.98)
Ghost:    bg-transparent, border border-border, hover: bg-bg-hover
Danger:   bg-error/20, border border-error, hover: bg-error/30
Disabled: opacity-40, cursor-not-allowed

Tamanhos: sm (h-8, px-3), md (h-10, px-4), lg (h-12, px-6)
```

### Badge
```
Provider:  bg-primary-500/20, border border-primary-500/40, text-primary-400
Domain:    bg-accent-500/20, border border-accent-500/40, text-accent-400
Success:   bg-success/20, text-success
Warning:   bg-warning/20, text-warning
Error:     bg-error/20, text-error
Dot (live): animate-pulse, bg-success
```

### Card
```
bg-bg-surface, border border-border
hover: border-border-active, shadow-glow-primary
padding: space-4 (interno), gap: space-4 (entre cards)
```

### Input / Textarea
```
bg-bg-elevated, border border-border
focus: border-primary-500, shadow-glow-primary
text: text-primary, placeholder: text-muted
```

### MessageBubble
```
User:      bg-primary-500/20, border-l-2 border-primary-500, self-end
Assistant: bg-bg-surface, border border-border, self-start
           + ProviderBadge + DomainBadge + CostIndicator no rodapé
Streaming: cursor piscante ▌ ao final do texto
```

### PipelineKanban
```
Cada etapa = coluna com card
Estado waiting:  border-border, opacity-50
Estado running:  border-primary-500, glow, spinner animado
Estado done:     border-success, check icon
Estado error:    border-error, x icon

Linha de progresso no topo: ██████░░░░░ 60%
```

### Sidebar
```
Desktop: 240px fixo, sempre visível
Tablet:  drawer, abre/fecha com swipe
Mobile:  hamburger menu → overlay fullscreen

NavItem:
  inactive: text-muted, hover: text-primary bg-bg-hover
  active:   text-primary-400, bg-primary-500/10, border-l-2 border-primary-500
```

---

## Layout

### Desktop (> 1024px)
```
┌──────────────────────────────────────────────────────────┐
│ Header: Logo | Status | Provider Badge | Token Volume    │
├─────────┬────────────────────────────────────────────────┤
│ Sidebar │                 Main Content                    │
│  240px  │         (ocupa o resto da largura)             │
│         │                                                │
│ NavLinks│   Page atual (Chat / Agents / Fábrica / etc)  │
└─────────┴────────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────────────┐
│ [≡] | Logo   | Badge     │  ← Header sticky
├──────────────────────────┤
│                          │
│   Conteúdo da página     │  ← Scroll principal
│                          │
├──────────────────────────┤
│ [Chat][Agents][Fábrica]  │  ← Bottom nav bar
└──────────────────────────┘
```

---

## Animações

```css
/* Typing indicator */
@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
.cursor-blink { animation: blink 1s step-end infinite; }

/* Glow pulse (IA ativa) */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 10px var(--color-primary-glow); }
  50%       { box-shadow: 0 0 25px var(--color-primary-glow); }
}
.ia-active { animation: glow-pulse 2s ease-in-out infinite; }

/* Skeleton loading */
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--color-bg-surface) 25%, var(--color-bg-elevated) 50%, var(--color-bg-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Slide in (painéis laterais) */
@keyframes slide-in-right { from { transform: translateX(100%) } to { transform: translateX(0) } }
```

---

## Acessibilidade (obrigatório)

```
- Todos os botões: aria-label descritivo
- Inputs: aria-label + <label> associado
- Status ao vivo: role="status" aria-live="polite"
- Foco visível: outline: 2px solid var(--color-primary-500)
- Contraste mínimo texto/fundo: 4.5:1 (WCAG AA)
- Navegação por teclado: Tab segue ordem visual, Escape fecha modais
```

---

## Fontes a carregar (Google Fonts)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```
