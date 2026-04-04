/**
 * architect.js — Agente Arquiteto (corrigido pelo Nexus v4.2)
 * Extração de JSON robusta — não quebra com conteúdo extra na resposta
 */

const { chamarIARaciocinio: chamarIA } = require('./aiService');

const SYSTEM_PROMPT = `Você é o ARQUITETO — engenheiro sênior especialista em design de sistemas.

Sua missão: receber o plano do Comandante e projetar arquitetura técnica completa.

REGRAS OBRIGATÓRIAS:
1) Retorne SOMENTE o objeto JSON, sem texto antes ou depois
2) Sem markdown, sem blocos de código, sem explicações
3) JSON deve começar com { e terminar com }
4) Use apenas campos simples — sem código dentro do JSON
5) Para webapp: máximo 3 tabelas, máximo 8 endpoints`;

function extrairJSON(texto) {
  // Tenta parsear direto primeiro
  try { return JSON.parse(texto.trim()); } catch {}

  // Remove blocos markdown se houver
  const semMarkdown = texto.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(semMarkdown); } catch {}

  // Encontra o primeiro objeto JSON válido usando profundidade de chaves
  let inicio = texto.indexOf('{');
  if (inicio === -1) return null;

  let profundidade = 0;
  let emString = false;
  let escape = false;

  for (let i = inicio; i < texto.length; i++) {
    const ch = texto[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && emString) { escape = true; continue; }
    if (ch === '"') { emString = !emString; continue; }
    if (emString) continue;
    if (ch === '{') profundidade++;
    if (ch === '}') {
      profundidade--;
      if (profundidade === 0) {
        try {
          return JSON.parse(texto.slice(inicio, i + 1));
        } catch {}
      }
    }
  }
  return null;
}

function fallbackArquitetura(plano) {
  const nome = plano?.nome_sugerido || 'ProjetoFabrica';
  return {
    nome_projeto: nome,
    objetivo_tecnico: plano?.descricao_executiva || 'Aplicação web com CRUD básico',
    tipo_entregavel: plano?.stack?.entregavel || 'webapp',
    tabelas: [
      {
        nome: 'itens',
        descricao: 'Registro principal',
        colunas: [
          { nome: 'id', tipo: 'uuid DEFAULT gen_random_uuid()', pk: true },
          { nome: 'titulo', tipo: 'text NOT NULL', pk: false },
          { nome: 'descricao', tipo: 'text', pk: false },
          { nome: 'criado_em', tipo: 'timestamptz DEFAULT now()', pk: false }
        ]
      }
    ],
    endpoints: [
      { metodo: 'GET', rota: '/api/itens', descricao: 'Listar' },
      { metodo: 'POST', rota: '/api/itens', descricao: 'Criar' },
      { metodo: 'PUT', rota: '/api/itens/:id', descricao: 'Atualizar' },
      { metodo: 'DELETE', rota: '/api/itens/:id', descricao: 'Excluir' }
    ],
    stack: {
      frontend: plano?.stack?.frontend || 'HTML/CSS/JS',
      backend: plano?.stack?.backend || 'Node.js/Express',
      banco: plano?.stack?.banco || 'PostgreSQL (Supabase)'
    },
    regras_negocio: plano?.funcionalidades_principais || ['CRUD básico']
  };
}

async function projetar(plano, contexto = '') {
  const entrada = typeof plano === 'object' ? JSON.stringify(plano, null, 2) : String(plano);
  const contextoExtra = contexto ? `\n\nCONTEXTO:\n${contexto}` : '';
  const prompt = `Projete a arquitetura técnica para este projeto. Retorne APENAS o JSON sem texto adicional.${contextoExtra}\n\nPLANO:\n${entrada}`;

  try {
    const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 8000);
    const json = extrairJSON(resposta);
    if (!json) {
      console.warn('[Architect] Sem JSON válido na resposta, usando fallback');
      return fallbackArquitetura(plano);
    }
    return json;
  } catch (err) {
    console.warn(`[Architect] Fallback ativado: ${err.message}`);
    return fallbackArquitetura(plano);
  }
}

module.exports = { projetar };
