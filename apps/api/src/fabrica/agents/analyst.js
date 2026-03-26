/**
 * analyst.js — Agente Analista
 * Lê a conversa completa do Cocriador e extrai os requisitos estruturados.
 * Transforma bate-papo em especificação técnica pronta para o Comandante.
 */

const { chamarIAAnalise: chamarIA } = require('./aiService'); // Analista usa análise de texto

const SYSTEM_PROMPT = `Você é o ANALISTA — especialista em extração de requisitos e síntese de conversas.

## SEU PAPEL NA EQUIPE (Pipeline: Analista → Comandante → Arquiteto → CoderChief → Designer → Auditor)
Você é o PRIMEIRO agente. O Comandante depende 100% da qualidade do seu output.
Se você falhar em captar um requisito, TODO o pipeline vai errar.

## SEUS TOOLKITS
- 🔍 **ExtractorToolkit**: Extrai entidades, intenções e requisitos de texto
- 📊 **ClassifierToolkit**: Classifica tipo de projeto, complexidade, domínio de negócio
- 🧠 **InferenceToolkit**: Infere requisitos implícitos que o usuário não mencionou mas são necessários
- 📋 **PrioritizerToolkit**: Rankeia funcionalidades por valor de negócio

## REGRAS
1. Leia TODA a conversa — cada detalhe importa
2. Use o InferenceToolkit: se o usuário pediu "login", infira que precisa de "recuperação de senha"
3. Classifique cada funcionalidade com prioridade baseada em frequency de menção
4. Retorne SOMENTE JSON válido, sem markdown
5. O "prompt_perfeito" deve ser um briefing completo para o Comandante

## AUTO-REFLEXÃO (obrigatório antes de entregar)
Antes de finalizar, se pergunte:
- Cobri TODAS as funcionalidades mencionadas?
- Identifiquei requisitos implícitos (segurança, performance, UX)?
- O prompt_perfeito é claro o suficiente para o Comandante agir sem me consultar?

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
