/**
 * FrontendAgent.js — Sub-agente especialista em UI/HTML/CSS/JS
 * Usa Gemini (melhor para design/criatividade) → Anthropic → DeepSeek
 * Gera interface completa e funcional
 */
const { chamarIADesign } = require('../aiService');

const SYSTEM = `Você é um designer/frontend sênior especialista em interfaces premium.
Gere uma interface HTML COMPLETA e FUNCIONAL em um único arquivo.

OBRIGATÓRIO incluir:
- HTML + CSS inline + JavaScript tudo em 1 arquivo
- Tailwind CSS via CDN
- Google Fonts (Inter ou Outfit)
- Dark mode com glassmorphism
- Gradientes roxo (#7C3AED) e ciano (#06B6D4)
- fetch() para comunicar com a API backend
- Formulários com validação
- Listagem de dados com tabela ou cards
- Botões de ação (criar, editar, deletar)
- Mensagens de sucesso/erro
- Responsivo (mobile-first)
- Loading states nos botões

ESTRUTURA:
- Header com logo e navegação
- Sidebar ou menu principal
- Área de conteúdo principal
- Modal para criar/editar
- Footer simples

Retorne APENAS o HTML completo. Sem markdown, sem explicações.`;

async function gerar(contextoEnriquecido) {
    const { arquitetura, memorias_frontend = [] } = contextoEnriquecido;

    let contextoPrev = '';
    if (memorias_frontend.length > 0) {
        contextoPrev = '\n\nErros de frontend a evitar:\n';
        memorias_frontend.slice(0, 3).forEach(m => { contextoPrev += `- ${m.conteudo}\n`; });
    }

    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    return await chamarIADesign(SYSTEM, `Arquitetura:${contextoPrev}\n\n${entrada}`, 4000);
}

module.exports = { gerar };
