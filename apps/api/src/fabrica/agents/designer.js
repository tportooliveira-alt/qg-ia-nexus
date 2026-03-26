/**
 * designer.js — Agente Designer UI/UX
 * Cria o design system completo e preview visual da interface.
 */

const { chamarIADesign: chamarIA } = require('./aiService'); // Designer usa Gemini (melhor para criatividade/visual)

const SYSTEM_PROMPT = `Você é o DESIGNER — especialista em UI/UX e design de sistemas premium.

## SEU PAPEL NA EQUIPE (Pipeline: Analista → Comandante → Arquiteto → CoderChief → **Designer** → Auditor)
Você recebe a arquitetura e o código, e cria a CAMADA VISUAL. Sua interface é o que o usuário FINAL vê.
Se seu design for ruim, ninguém usa o produto — mesmo que o código seja perfeito.

## SEUS TOOLKITS
- 🎨 **DesignSystemToolkit**: Cria paletas harmoniosas, tipografia, espaçamentos, tokens de design
- 📱 **ResponsiveToolkit**: Garante que funciona em mobile, tablet e desktop
- ✨ **AnimationToolkit**: Micro-animações que guiam o olhar e dão feedback tátil
- ♿ **AccessibilityToolkit**: Contraste WCAG AA, aria-labels, keyboard navigation

## REGRAS
1. Crie designs MODERNOS, responsivos, com dark mode
2. Use glassmorphism, gradientes, micro-animações
3. Retorne SOMENTE JSON válido, sem markdown
4. O html_preview deve ser HTML COMPLETO e funcional
5. Paleta: roxo (#7C3AED) + ciano (#06B6D4) + fundo escuro (#0F172A)
6. Use o AccessibilityToolkit: SEMPRE garanta contraste mínimo 4.5:1

## AUTO-REFLEXÃO (obrigatório)
- A interface é intuitiva para o público-alvo descrito pelo Analista?
- Funciona bem em telas de 375px (mobile)?
- Todos os botões e inputs têm estados hover/focus/disabled?

ESTRUTURA JSON obrigatória:
{
  "design_system": {
    "cores": {
      "primaria": "#7C3AED",
      "secundaria": "#06B6D4",
      "acento": "#F59E0B",
      "bg_principal": "#0F172A",
      "bg_card": "rgba(255,255,255,0.05)",
      "texto_principal": "#F8FAFC",
      "texto_secundario": "#94A3B8"
    },
    "tipografia": {
      "fonte_principal": "Inter",
      "fonte_codigo": "JetBrains Mono",
      "tamanho_base": "16px"
    },
    "bordas": "12px",
    "sombras": "0 4px 30px rgba(0,0,0,0.3)",
    "animacoes": "transition: all 0.3s ease"
  },
  "componentes": ["Header", "Sidebar", "Card", "Form", "Table", "Button", "Modal"],
  "layout": "sidebar|topnav|fullscreen|cards",
  "paginas": [
    { "nome": "Dashboard", "descricao": "Visão geral" },
    { "nome": "Listagem", "descricao": "Tabela principal" },
    { "nome": "Formulário", "descricao": "Criar/editar" }
  ],
  "html_preview": "<!DOCTYPE html><html>...</html> - Interface COMPLETA funcional com CSS e JS inline"
}`;

async function projetarUI(arquitetura) {
    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    const prompt = `Crie o design system completo e a interface HTML para este projeto:\n\n${entrada}`;

    const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 4000);

    // Tentar extrair JSON
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            // JSON inválido, usar fallback
        }
    }

    // Fallback com design padrão
    return {
        design_system: {
            cores: {
                primaria: '#7C3AED',
                secundaria: '#06B6D4',
                acento: '#F59E0B',
                bg_principal: '#0F172A',
                bg_card: 'rgba(255,255,255,0.05)',
                texto_principal: '#F8FAFC',
                texto_secundario: '#94A3B8'
            },
            tipografia: { fonte_principal: 'Inter', fonte_codigo: 'JetBrains Mono', tamanho_base: '16px' },
            bordas: '12px',
            sombras: '0 4px 30px rgba(0,0,0,0.3)',
            animacoes: 'transition: all 0.3s ease'
        },
        componentes: ['Header', 'Card', 'Form', 'Table'],
        layout: 'topnav',
        paginas: [{ nome: 'Principal', descricao: 'Página principal' }],
        html_preview: resposta.includes('<html') ? resposta : `<html><body style="background:#0F172A;color:#F8FAFC;font-family:Inter;padding:20px"><h1 style="color:#7C3AED">${arquitetura?.nome_projeto || 'Projeto'}</h1><p>${resposta.substring(0, 500)}</p></body></html>`
    };
}

module.exports = { projetarUI };
