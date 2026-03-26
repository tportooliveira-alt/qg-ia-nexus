/**
 * SqlAgent.js — Sub-agente especialista em SQL/PostgreSQL/Supabase
 * Usa DeepSeek (melhor para código) → Groq → Gemini
 * Custo: mínimo (DeepSeek é o mais barato para código)
 */
const { chamarIACodigo } = require('../aiService');
const AgentMemory = require('../../core/AgentMemory');

const SYSTEM = `Você é um DBA expert em PostgreSQL e Supabase.
Gere o SQL COMPLETO e FUNCIONAL para criar todas as tabelas da arquitetura.

OBRIGATÓRIO:
- gen_random_uuid() como PK padrão
- timestamptz DEFAULT now() para datas
- NOT NULL nos campos obrigatórios
- FOREIGN KEY com ON DELETE CASCADE
- Índices nos campos de busca frequente
- RLS desativado (será configurado depois)
- Sem markdown, sem blocos de codigo — apenas SQL puro

SEGURANÇA (sempre incluir):
- Nunca expor senhas em texto plano (usar campo tipo hash TEXT)
- Campos de email com LOWER() check constraint
- Auditoria: criado_em + atualizado_em em toda tabela`;

async function gerar(contextoEnriquecido) {
    const { arquitetura, usuario_id, memorias_sql = [] } = contextoEnriquecido;

    // Injetar memórias de erros anteriores no prompt
    let contextoPrev = '';
    if (memorias_sql.length > 0) {
        contextoPrev = '\n\nErros SQL a evitar (memória de projetos anteriores):\n';
        memorias_sql.slice(0, 3).forEach(m => { contextoPrev += `- ${m.conteudo}\n`; });
    }

    const entrada = typeof arquitetura === 'object' ? JSON.stringify(arquitetura, null, 2) : String(arquitetura);
    const prompt = `Gere o SQL completo para esta arquitetura:${contextoPrev}\n\n${entrada}`;

    const sql = await chamarIACodigo(SYSTEM, prompt, 3000);

    // Aprender: salvar que gerou SQL para este tipo de projeto
    if (usuario_id) {
        AgentMemory.salvar('sql_agent', usuario_id, {
            tipo: 'execucao',
            conteudo: `SQL gerado para ${arquitetura.nome_projeto || 'projeto'} (${arquitetura.tabelas?.length || 0} tabelas)`,
        }).catch(() => {});
    }

    return sql;
}

module.exports = { gerar };
