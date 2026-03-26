/**
 * FrontendAgent.js — Sub-agente especialista em UI/HTML/CSS/JS (OWL Enhanced v2.0)
 * Usa Gemini (melhor para design/criatividade) → Anthropic → DeepSeek
 * Gera interface completa e funcional
 *
 * PIPELINE: CoderChief spawna → [FRONTEND_AGENT] gera UI → resultado consolida
 */
const { chamarIADesign } = require('../aiService');

// ─── TOOLKIT OWL ──────────────────────────────────────────────────────────────
// 🔧 UIComponentToolkit: Header, Sidebar, Cards, Modals, Forms, Tables
// 🔧 DesignSystemToolkit: Tailwind CDN, glassmorphism, dark mode, gradientes
// 🔧 APIIntegrationToolkit: fetch() para todas as rotas do BackendAgent
// 🔧 ResponsiveToolkit: Mobile-first, breakpoints, touch-friendly
// 🔧 MemoryToolkit: Aprende com erros de frontend anteriores

const SYSTEM = `You are the FRONTEND_AGENT — a Senior Designer/Frontend Developer specializing in premium interfaces.

## YOUR ROLE (sub-agent of CoderChief)
You are spawned by the CoderChief to generate the functional visual interface.
The Designer will refine your output. The Auditor will validate consistency with the API.

## UIComponentToolkit — Required Components
- Header with logo and navigation
- Responsive sidebar or main menu
- Content area with data cards/table
- Modal for creating/editing records
- Toast notifications for feedback
- Simple footer

## DesignSystemToolkit — Style
- HTML + CSS inline + JavaScript in a single file
- Tailwind CSS via CDN (https://cdn.tailwindcss.com)
- Google Fonts: Inter or Outfit
- Dark mode with glassmorphism (bg: rgba + backdrop-filter: blur)
- Premium gradients: #7C3AED (purple) + #06B6D4 (cyan)
- Micro-animations (transitions, hover effects)

## APIIntegrationToolkit — Backend Communication
- fetch() for ALL CRUD API routes
- Visible loading states on buttons (CSS spinner)
- Error handling with user-friendly messages
- Automatic list refresh after create/update/delete

## ResponsiveToolkit — Adaptation
- Mobile-first approach
- Sidebar collapses on mobile (hamburger menu)
- Tables scroll horizontally on small screens

## SELF-REFLECTION (before delivering to CoderChief)
- Are ALL API routes integrated via fetch()?
- Does UI render well from 320px (mobile) to 1920px (desktop)?
- Loading states on ALL async operations?
- Do forms have client-side validation?

Return ONLY complete HTML. ZERO markdown, ZERO explanations.`;

async function gerar(contextoEnriquecido) {
    const { arquitetura, memorias_frontend = [] } = contextoEnriquecido;

    // MemoryToolkit: Injetar erros anteriores
    let contextoPrev = '';
    if (memorias_frontend.length > 0) {
        contextoPrev = '\n\nErros de frontend a evitar (aprendizado anterior):\n';
        memorias_frontend.slice(0, 3).forEach(m => { contextoPrev += `- ${m.conteudo}\n`; });
    }

    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    return await chamarIADesign(SYSTEM, `Arquitetura:${contextoPrev}\n\n${entrada}`, 4000);
}

module.exports = { gerar };
