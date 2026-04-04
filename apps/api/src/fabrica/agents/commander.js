/**
 * commander.js - Agente Comandante (v4.2 — extração JSON robusta)
 */

const { chamarIARaciocinio: chamarIA } = require('./aiService');

const SYSTEM_PROMPT = `Você é o COMANDANTE, planejador estratégico da Fábrica de IA.
Retorne APENAS o objeto JSON, sem texto antes ou depois, sem markdown.
Schema obrigatório:
{
  "tipo_projeto": "app",
  "nome_sugerido": "NomeProjeto",
  "complexidade": "simples|media|complexa",
  "descricao_executiva": "máximo 200 chars",
  "stack": {
    "entregavel": "webapp|api|site",
    "frontend": "React|HTML/CSS/JS",
    "backend": "Node.js/Express",
    "banco": "PostgreSQL|Supabase",
    "extras": []
  },
  "etapas": [
    {"ordem":1,"agente":"Arquiteto","tarefa":"estrutura técnica"},
    {"ordem":2,"agente":"Codificador","tarefa":"backend e frontend"},
    {"ordem":3,"agente":"Designer","tarefa":"visual responsivo"},
    {"ordem":4,"agente":"Auditor","tarefa":"validação final"}
  ],
  "funcionalidades_principais": ["feat1","feat2"],
  "publico_alvo": "descrição",
  "resumo": "resumo executivo"
}`;

function extrairJSON(texto) {
  try { return JSON.parse(texto.trim()); } catch {}
  const semMd = texto.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(semMd); } catch {}
  let inicio = texto.indexOf('{');
  if (inicio === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    if (c === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(texto.slice(inicio, i + 1)); } catch {}
      }
    }
  }
  return null;
}

function fallbackPlano(ideia) {
  return {
    tipo_projeto: 'app',
    nome_sugerido: 'ProjetoFabrica',
    complexidade: 'media',
    descricao_executiva: (ideia || '').slice(0, 180) || 'Projeto gerado via fallback',
    stack: { entregavel: 'webapp', frontend: 'HTML/CSS/JS', backend: 'Node.js/Express', banco: 'PostgreSQL', extras: [] },
    etapas: [
      { ordem: 1, agente: 'Arquiteto', tarefa: 'Definir estrutura técnica' },
      { ordem: 2, agente: 'Codificador', tarefa: 'Gerar backend e frontend' },
      { ordem: 3, agente: 'Designer', tarefa: 'Aplicar visual responsivo' },
      { ordem: 4, agente: 'Auditor', tarefa: 'Validar consistência' }
    ],
    funcionalidades_principais: ['CRUD completo', 'Listagem', 'Cadastro', 'Edição'],
    publico_alvo: 'Usuário geral',
    resumo: 'Plano fallback operacional'
  };
}

async function analisar(ideia, contexto = '') {
  const ctx = contexto ? `\n\nCONTEXTO:\n${contexto}` : '';
  const prompt = `Analise e planeje. Retorne APENAS o JSON.${ctx}\n\nIDEIA: "${ideia}"`;

  try {
    const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 8000);
    const json = extrairJSON(resposta);
    if (!json || !json.nome_sugerido) {
      console.warn('[Commander] JSON inválido, usando fallback');
      return fallbackPlano(ideia);
    }
    return json;
  } catch (err) {
    console.warn(`[Commander] Fallback: ${err.message}`);
    return fallbackPlano(ideia);
  }
}

module.exports = { analisar };
