/**
 * commander.js - Agente Comandante
 */

const { chamarIARaciocinio: chamarIA } = require('./aiService');

const SYSTEM_PROMPT = `You are the COMMANDER, strategic planner of the software factory.
Return only valid JSON with project type, stack, steps and key features.`;

function fallbackPlano(ideia) {
  return {
    tipo_projeto: 'app',
    nome_sugerido: 'ProjetoFabrica',
    complexidade: 'media',
    descricao_executiva: (ideia || '').slice(0, 180) || 'Projeto gerado via fallback do comandante',
    stack: {
      entregavel: 'webapp',
      frontend: 'HTML/CSS/JS',
      backend: 'Node.js/Express',
      banco: 'PostgreSQL',
      extras: ['fallback_mode']
    },
    etapas: [
      { ordem: 1, agente: 'Arquiteto', tarefa: 'Definir estrutura tecnica minima' },
      { ordem: 2, agente: 'Codificador', tarefa: 'Gerar backend, banco e frontend basico' },
      { ordem: 3, agente: 'Designer', tarefa: 'Aplicar visual responsivo' },
      { ordem: 4, agente: 'Auditor', tarefa: 'Validar consistencia final' }
    ],
    funcionalidades_principais: ['CRUD basico', 'Listagem', 'Cadastro', 'Edicao', 'Exclusao'],
    publico_alvo: 'Usuario geral',
    resumo: 'Plano fallback para manter pipeline operacional sem IA'
  };
}

async function analisar(ideia, contexto = '') {
  const contextoExtra = contexto ? `\n\nCONTEXTO:\n${contexto}` : '';
  const prompt = `Analyze this idea and build a full execution plan.${contextoExtra}\n\n"${ideia}"`;

  try {
    const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 2000);
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackPlano(ideia);
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn(`[Commander] Fallback ativado: ${err.message}`);
    return fallbackPlano(ideia);
  }
}

module.exports = { analisar };
