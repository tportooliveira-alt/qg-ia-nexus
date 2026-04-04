/**
 * analyst.js - Agente Analista
 */

const { chamarIAAnalise: chamarIA } = require('./aiService');

const SYSTEM_PROMPT = `You are the ANALYST.
Extract requirements from conversation and return only valid JSON.`;

function fallbackSpec(textoConversa) {
  return {
    ideia_condensada: String(textoConversa || '').slice(0, 200),
    tipo_projeto: 'app',
    funcionalidades: [
      { nome: 'CRUD basico', prioridade: 'alta', detalhes: 'Criar, listar, editar e excluir itens' }
    ],
    publico_alvo: 'Usuario geral',
    restricoes: [],
    stack_preferida: { frontend: null, backend: null, banco: null },
    tom_design: 'moderno',
    dados_necessarios: ['itens', 'descricao', 'datas'],
    integracoes: [],
    prompt_perfeito: String(textoConversa || '').slice(0, 8000)
  };
}

async function analisarConversa(conversa, contexto = '') {
  let textoConversa = '';

  if (Array.isArray(conversa)) {
    textoConversa = conversa.map(msg => {
      const role = msg.role === 'user' ? 'Usuario' : 'IA';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
  } else {
    textoConversa = String(conversa || '');
  }

  const contextoExtra = contexto ? `\n\nCONTEXTO:\n${contexto}` : '';
  const prompt = `Analyze this conversation and extract all requirements.${contextoExtra}\n\n${textoConversa}`;

  try {
    const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 2500);
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackSpec(textoConversa);
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn(`[Analyst] Fallback ativado: ${err.message}`);
    return fallbackSpec(textoConversa);
  }
}

async function conversaParaPrompt(conversa) {
  const spec = await analisarConversa(conversa);
  return spec.prompt_perfeito || spec.ideia_condensada;
}

module.exports = { analisarConversa, conversaParaPrompt };
