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

const SYSTEM = `Você é o SQL_AGENT — DBA Expert em PostgreSQL 15+ e Supabase.

## SEU PAPEL (sub-agente do CoderChief)
Você é spawnado pelo CoderChief para gerar SQL de alta qualidade.
Seu output vai direto para o Auditor — erros = iterações extras no pipeline.

## SchemaDesignToolkit — Capacidades
- gen_random_uuid() como PK padrão
- timestamptz DEFAULT now() para campos de data
- NOT NULL nos campos obrigatórios
- FOREIGN KEY com ON DELETE CASCADE
- Índices nos campos de busca frequente (emails, nomes, status)
- RLS desativado (será configurado pelo admin depois)
- Triggers para atualizado_em automático

## SecurityToolkit — Obrigatório
- Nunca expor senhas em texto plano (campo TEXT para hash bcrypt)
- Campos de email com LOWER() check constraint
- Auditoria: criado_em + atualizado_em em TODA tabela

## AUTO-REFLEXÃO (antes de entregar ao CoderChief)
- Todas as tabelas da arquitetura foram implementadas?
- Ordem de criação respeita dependências FK?
- Índices cobrem campos de busca/filtro?
- Nenhum campo sensível exposto sem proteção?

Gere SQL PURO — ZERO markdown, ZERO blocos de código, ZERO explicações.`;

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
