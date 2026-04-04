/**
 * SqlAgent.js — Sub-agente especialista em SQL/PostgreSQL/Supabase (OWL Enhanced v2.0)
 * Usa DeepSeek (melhor para código) → Groq → Gemini
 * Custo: mínimo (DeepSeek é o mais barato para código)
 *
 * PIPELINE: CoderChief spawna → [SQL_AGENT] gera SQL → resultado consolida
 */
const { chamarIACodigo } = require('../aiService');
const AgentMemory = require('../../core/AgentMemory');

// ─── TOOLKIT OWL ──────────────────────────────────────────────────────────────
// 🔧 SchemaDesignToolkit: gen_random_uuid, timestamptz, RLS, partitioning
// 🔧 MemoryToolkit: Aprende com erros de projetos anteriores (evita repetição)
// 🔧 SecurityToolkit: Hash de senhas, LOWER() em emails, auditoria temporal

const SYSTEM = `You are the SQL_AGENT — a PostgreSQL 15+ and Supabase DBA Expert.

## YOUR ROLE (sub-agent of CoderChief)
You are spawned by the CoderChief to generate high-quality SQL.
Your output goes directly to the Auditor — errors = extra iterations in the pipeline.

## SchemaDesignToolkit — Capabilities
- gen_random_uuid() as default PK
- timestamptz DEFAULT now() for date fields
- NOT NULL on required fields
- FOREIGN KEY with ON DELETE CASCADE
- Indexes on frequently searched fields (emails, names, status)
- RLS disabled (will be configured by admin later)
- Automatic atualizado_em triggers

## SecurityToolkit — Mandatory
- Never expose passwords in plaintext (TEXT field for bcrypt hash)
- Email fields must have LOWER() check constraint
- Audit trail: criado_em + atualizado_em on EVERY table

## SELF-REFLECTION (before delivering to CoderChief)
- Were ALL tables from the architecture implemented?
- Does creation order respect FK dependencies?
- Do indexes cover search/filter fields?
- No sensitive fields exposed without protection?

Generate PURE SQL — ZERO markdown, ZERO code blocks, ZERO explanations.`;

async function gerar(contextoEnriquecido) {
    const { arquitetura, usuario_id, memorias_sql = [] } = contextoEnriquecido;

    // MemoryToolkit: Injetar memórias de erros anteriores no prompt
    let contextoPrev = '';
    if (memorias_sql.length > 0) {
        contextoPrev = '\n\nErros SQL a evitar (aprendizado de projetos anteriores):\n';
        memorias_sql.slice(0, 3).forEach(m => { contextoPrev += `- ${m.conteudo}\n`; });
    }

    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    const prompt = `Gere o SQL completo para esta arquitetura:${contextoPrev}\n\n${entrada}`;

    const sql = await chamarIACodigo(SYSTEM, prompt, 3000);

    // MemoryToolkit: Salvar execução para aprendizado futuro
    if (usuario_id) {
        AgentMemory.salvar('sql_agent', usuario_id, {
            tipo: 'execucao',
            conteudo: `SQL gerado para ${arquitetura.nome_projeto || 'projeto'} (${arquitetura.tabelas?.length || 0} tabelas)`,
        }).catch(() => {});
    }

    return sql;
}

module.exports = { gerar };

// Patch v4.2: Remove markdown fences do SQL
const _gerSqlOriginal = module.exports.gerar;
module.exports.gerar = async function(ctx) {
  let sql = await _gerSqlOriginal(ctx);
  if (typeof sql === 'string') {
    sql = sql.replace(/^```sql\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim();
  }
  return sql;
};
