/**
 * architect.js — Agente Arquiteto
 * Recebe o plano do Comandante e projeta a estrutura técnica completa:
 * banco de dados, endpoints, relacionamentos, contratos de API.
 */

const { chamarIARaciocinio: chamarIA } = require('./aiService'); // Arquiteto usa raciocínio técnico profundo

const SYSTEM_PROMPT = `Você é o ARQUITETO — engenheiro sênior especialista em design de sistemas.

Sua missão: receber o plano do Comandante e projetar a arquitetura técnica COMPLETA.

Você arquiteta QUALQUER tipo de entregável:
- Para apps/APIs: projete tabelas PostgreSQL + endpoints REST
- Para planilhas: projete abas, colunas, fórmulas, relacionamentos entre abas
- Para documentos Word: projete seções, cabeçalhos, campos, estrutura do documento
- Para sites: projete páginas, componentes, dados necessários
- Para dashboards: projete métricas, gráficos, fontes de dados

REGRAS:
1. Retorne SOMENTE JSON válido, sem markdown
2. Seja preciso — use tipos corretos do PostgreSQL (uuid, text, int, timestamptz, jsonb, boolean, decimal)
3. Para planilhas: use "abas" em vez de "tabelas"
4. Para documentos: use "secoes" em vez de "tabelas"
5. Todos os relacionamentos devem estar explícitos

ESTRUTURA JSON obrigatória:
{
  "nome_projeto": "Nome técnico do projeto",
  "objetivo_tecnico": "O que o sistema faz em 1 linha técnica",
  "tipo_entregavel": "webapp|planilha|documento|api|site|dashboard",
  "tabelas": [
    {
      "nome": "nome_tabela",
      "descricao": "para que serve",
      "colunas": [
        { "nome": "id", "tipo": "uuid DEFAULT gen_random_uuid()", "pk": true, "obrigatorio": true },
        { "nome": "nome", "tipo": "text NOT NULL", "pk": false, "obrigatorio": true },
        { "nome": "criado_em", "tipo": "timestamptz DEFAULT now()", "pk": false, "obrigatorio": false }
      ]
    }
  ],
  "endpoints": [
    { "metodo": "GET", "rota": "/api/itens", "descricao": "Lista todos os itens", "auth": false },
    { "metodo": "POST", "rota": "/api/itens", "descricao": "Cria novo item", "auth": true }
  ],
  "relacionamentos": [
    { "de": "tabela_a.campo_id", "para": "tabela_b.id", "tipo": "N:1" }
  ],
  "stack": {
    "frontend": "tecnologia frontend",
    "backend": "tecnologia backend",
    "banco": "PostgreSQL (Supabase)"
  },
  "regras_negocio": ["regra importante 1", "regra importante 2"]
}`;

async function projetar(plano) {
    const entrada = typeof plano === 'object' ? JSON.stringify(plano, null, 2) : String(plano);
    const prompt = `Com base neste plano, projete a arquitetura técnica completa:\n\n${entrada}`;

    const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 3000);

    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Arquiteto não retornou JSON válido');

    return JSON.parse(jsonMatch[0]);
}

module.exports = { projetar };
