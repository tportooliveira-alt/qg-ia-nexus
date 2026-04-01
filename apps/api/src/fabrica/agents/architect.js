/**
 * architect.js — Agente Arquiteto
 * Recebe o plano do Comandante e projeta a arquitetura técnica.
 */

const { chamarIARaciocinio: chamarIA } = require('./aiService');

const SYSTEM_PROMPT = `Você é o ARQUITETO — engenheiro sênior especialista em design de sistemas.

Sua missão: receber o plano do Comandante e projetar arquitetura técnica completa.

REGRAS:
1) Retorne SOMENTE JSON válido
2) Inclua tabelas e endpoints mínimos para execução do pipeline
3) Para webapp, priorize PostgreSQL + API REST simples`;

function fallbackArquitetura(plano) {
  const nome = plano?.nome_sugerido || 'ProjetoFabrica';
  return {
    nome_projeto: nome,
    objetivo_tecnico: plano?.descricao_executiva || 'Aplicação web com CRUD básico',
    tipo_entregavel: plano?.stack?.entregavel || 'webapp',
    tabelas: [
      {
        nome: 'itens',
        descricao: 'Registro principal do sistema',
        colunas: [
          { nome: 'id', tipo: 'uuid DEFAULT gen_random_uuid()', pk: true, obrigatorio: true },
          { nome: 'titulo', tipo: 'text NOT NULL', pk: false, obrigatorio: true },
          { nome: 'descricao', tipo: 'text', pk: false, obrigatorio: false },
          { nome: 'criado_em', tipo: 'timestamptz DEFAULT now()', pk: false, obrigatorio: false },
          { nome: 'atualizado_em', tipo: 'timestamptz DEFAULT now()', pk: false, obrigatorio: false }
        ]
      }
    ],
    endpoints: [
      { metodo: 'GET', rota: '/api/itens', descricao: 'Listar itens', auth: false },
      { metodo: 'GET', rota: '/api/itens/:id', descricao: 'Buscar item por ID', auth: false },
      { metodo: 'POST', rota: '/api/itens', descricao: 'Criar item', auth: false },
      { metodo: 'PUT', rota: '/api/itens/:id', descricao: 'Atualizar item', auth: false },
      { metodo: 'DELETE', rota: '/api/itens/:id', descricao: 'Excluir item', auth: false }
    ],
    relacionamentos: [],
    stack: {
      frontend: plano?.stack?.frontend || 'HTML/CSS/JS',
      backend: plano?.stack?.backend || 'Node.js/Express',
      banco: plano?.stack?.banco || 'PostgreSQL (Supabase)'
    },
    regras_negocio: plano?.funcionalidades_principais || ['CRUD básico de itens']
  };
}

async function projetar(plano, contexto = '') {
  const entrada = typeof plano === 'object' ? JSON.stringify(plano, null, 2) : String(plano);
  const contextoExtra = contexto ? `\n\nCONTEXTO:\n${contexto}` : '';
  const prompt = `Com base neste plano, projete a arquitetura técnica completa.${contextoExtra}\n\n${entrada}`;

  try {
    const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 3000);
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackArquitetura(plano);
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.warn(`[Architect] Fallback ativado: ${err.message}`);
    return fallbackArquitetura(plano);
  }
}

module.exports = { projetar };
