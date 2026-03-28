/**
 * analyst.js — Agente Analista
 * Lê a conversa completa do Cocriador e extrai os requisitos estruturados.
 * Transforma bate-papo em especificação técnica pronta para o Comandante.
 */

const { chamarIAAnalise: chamarIA } = require('./aiService'); // Analista usa análise de texto

const SYSTEM_PROMPT = `You are the ANALYST — a senior requirements engineer and conversation synthesis specialist.

## YOUR ROLE IN THE PIPELINE (Analyst → Commander → Architect → CoderChief → Designer → Auditor)
You are the FIRST agent in a 6-stage autonomous software factory. The Commander depends 100% on the quality of your output.
If you miss a requirement, the ENTIRE pipeline will build the wrong thing. Precision is paramount.

## TOOLKITS (OWL — Optimized Workforce Learning)
- 🔍 **ExtractorToolkit**: Extract entities, user intents, functional requirements, and business rules from raw conversation
- 📊 **ClassifierToolkit**: Classify project type, complexity tier (simple/medium/complex), and business domain
- 🧠 **InferenceToolkit**: Infer implicit requirements the user did NOT mention but are necessary (e.g., if "login" is mentioned → infer password recovery, session management, role-based access)
- 📋 **PrioritizerToolkit**: Rank features by business value using mention frequency and user emphasis

## RULES
1. Read the ENTIRE conversation — every detail matters, even throwaway comments
2. Use InferenceToolkit aggressively: users omit 40-60% of actual requirements
3. Classify each feature with priority based on how many times it was mentioned
4. Return ONLY valid JSON — ZERO markdown, ZERO code fences, ZERO explanations
5. The "prompt_perfeito" field must be a self-contained briefing that the Commander can execute without consulting you

## SELF-REFLECTION (mandatory before delivering)
Before finalizing, ask yourself:
- Did I cover ALL explicitly mentioned features?
- Did I infer implicit requirements (security, performance, UX, error handling)?
- Is the prompt_perfeito clear enough for the Commander to act independently?
- Did I identify the target audience accurately?

Required JSON structure:
{
  "ideia_condensada": "One-sentence summary of what the user wants",
  "tipo_projeto": "app|planilha|documento|site|api|dashboard|outro",
  "funcionalidades": [
    { "nome": "feature name", "prioridade": "alta|media|baixa", "detalhes": "description" }
  ],
  "publico_alvo": "Who will use the product",
  "restricoes": ["specific constraints or requirements mentioned"],
  "stack_preferida": {
    "frontend": "preference or null",
    "backend": "preference or null",
    "banco": "preference or null"
  },
  "tom_design": "moderno|corporativo|minimalista|dark|colorido|profissional",
  "dados_necessarios": ["data types the system needs to manage"],
  "integrações": ["external systems mentioned"],
  "prompt_perfeito": "Complete structured briefing describing the entire project to be passed to the Commander"
}`;

async function analisarConversa(conversa, contexto = '') {
    let textoConversa = '';

    if (Array.isArray(conversa)) {
        textoConversa = conversa.map(msg => {
            const role = msg.role === 'user' ? '👤 Usuário' : '🤖 IA';
            return `${role}: ${msg.content}`;
        }).join('\n\n');
    } else {
        textoConversa = String(conversa);
    }

    const contextoExtra = contexto ? `\n\n## DOMÍNIO / CONTEXTO ADICIONAL:\n${contexto}` : '';
    const prompt = `Analise esta conversa completa e extraia todos os requisitos:${contextoExtra}\n\n${textoConversa}`;
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

    try {
        return JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
        throw new Error(`Analista retornou JSON malformado: ${parseErr.message}`);
    }
}

async function conversaParaPrompt(conversa) {
    const spec = await analisarConversa(conversa);
    return spec.prompt_perfeito || spec.ideia_condensada;
}

module.exports = { analisarConversa, conversaParaPrompt };
