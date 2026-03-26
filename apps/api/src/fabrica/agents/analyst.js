/**
 * analyst.js — Agente Analista
 * Lê a conversa completa do Cocriador e extrai os requisitos estruturados.
 * Transforma bate-papo em especificação técnica pronta para o Comandante.
 */

const { chamarIAAnalise: chamarIA } = require('./aiService'); // Analista usa análise de texto

const SYSTEM_PROMPT = `Você é o ANALISTA — especialista em extração de requisitos e síntese de conversas.

Sua missão: ler uma conversa entre usuário e IA (Cocriador) e extrair TUDO que é relevante para construir o produto.

REGRAS:
1. Leia TODA a conversa com atenção
2. Extraia objetivos, funcionalidades, preferências, restrições
3. Retorne SOMENTE JSON válido, sem markdown
4. Seja completo — não deixe nada de fora
5. O "prompt_perfeito" deve ser um briefing completo para o próximo agente

ESTRUTURA JSON obrigatória:
{
  "ideia_condensada": "Resumo em 1 frase do que o usuário quer",
  "tipo_projeto": "app|planilha|documento|site|api|dashboard|outro",
  "funcionalidades": [
    { "nome": "nome da função", "prioridade": "alta|media|baixa", "detalhes": "descrição" }
  ],
  "publico_alvo": "Quem vai usar o produto",
  "restricoes": ["limitações ou requisitos específicos mencionados"],
  "stack_preferida": {
    "frontend": "preferência ou null",
    "backend": "preferência ou null",
    "banco": "preferência ou null"
  },
  "tom_design": "moderno|corporativo|minimalista|dark|colorido|profissional",
  "dados_necessarios": ["tipos de dados que o sistema precisa gerenciar"],
  "integrações": ["sistemas externos mencionados"],
  "prompt_perfeito": "Briefing completo e estruturado descrevendo o projeto inteiro para ser passado ao Comandante"
}`;

async function analisarConversa(conversa) {
    let textoConversa = '';

    if (Array.isArray(conversa)) {
        textoConversa = conversa.map(msg => {
            const role = msg.role === 'user' ? '👤 Usuário' : '🤖 IA';
            return `${role}: ${msg.content}`;
        }).join('\n\n');
    } else {
        textoConversa = String(conversa);
    }

    const prompt = `Analise esta conversa completa e extraia todos os requisitos:\n\n${textoConversa}`;
    const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 2500);

    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        // Fallback: retorna estrutura básica com o texto
        return {
            ideia_condensada: textoConversa.substring(0, 200),
            tipo_projeto: 'app',
            funcionalidades: [],
            publico_alvo: 'Usuário geral',
            restricoes: [],
            stack_preferida: { frontend: null, backend: null, banco: null },
            tom_design: 'moderno',
            dados_necessarios: [],
            integrações: [],
            prompt_perfeito: textoConversa
        };
    }

    return JSON.parse(jsonMatch[0]);
}

async function conversaParaPrompt(conversa) {
    const spec = await analisarConversa(conversa);
    return spec.prompt_perfeito || spec.ideia_condensada;
}

module.exports = { analisarConversa, conversaParaPrompt };
