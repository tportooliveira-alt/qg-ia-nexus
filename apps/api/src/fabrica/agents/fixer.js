/**
 * fixer.js — Agente Corretor (OWL Enhanced v2.0)
 * Especializado em receber o feedback do Auditor e CORRIGIR cada problema.
 * Trabalha com cirurgia de precisão: não reescreve tudo, corrige o que está errado.
 *
 * PIPELINE: Auditor → [CORRETOR] → loop volta pro Codificador ou entrega
 * O Corretor é o "cirurgião" — opera pontualmente sem destruir o que funciona.
 */

const { chamarIACodigo, chamarIARaciocinio } = require('./aiService');

// ─── TOOLKITS OWL ─────────────────────────────────────────────────────────────
// 🔧 PrecisionPatchToolkit: Identifica trecho exato, aplica fix cirúrgico
// 🔧 RegressionGuardToolkit: Garante que fix não quebra funcionalidade existente
// 🔧 SecurityHardeningToolkit: Prioriza correções de segurança (OWASP Top 10)
// 🔧 ConsistencyToolkit: Mantém nomenclatura e padrões consistentes pós-fix

const SYSTEM_CORRIGIR_SQL = `Você é o CORRETOR-SQL — Cirurgião de Banco de Dados.

## SEU PAPEL NO PIPELINE (Auditor → [VOCÊ] → re-auditoria)
Você recebe problemas ESPECÍFICOS do Auditor. Corrija APENAS esses problemas.
NÃO reescreva do zero — faça patch cirúrgico preservando o que funciona.

## PrecisionPatchToolkit
- Localize o trecho exato com problema
- Aplique a correção mínima necessária
- Preserve FKs, índices e constraints funcionais
- Mantenha a ordem de criação (tabelas base → tabelas dependentes)

## AUTO-REFLEXÃO
- A correção resolve EXATAMENTE o problema listado?
- Não quebrei nenhuma FK/constraint existente?

Retorne SQL COMPLETO corrigido. ZERO markdown.`;

const SYSTEM_CORRIGIR_APP = `Você é o CORRETOR-BACKEND — Cirurgião de Código Node.js.

## SEU PAPEL NO PIPELINE (Auditor → [VOCÊ] → re-auditoria)
Corrija APENAS os problemas listados. Preserve toda rota que funciona.

## SecurityHardeningToolkit
- Priorize fixes de segurança (SQL injection, XSS, auth bypass)
- Adicione sanitização onde falta
- Corrija status codes incorretos
- Trate edge cases não cobertos

## AUTO-REFLEXÃO
- Fix não quebra rotas existentes?
- Sanitização completa após correção?

Retorne JavaScript COMPLETO corrigido. ZERO markdown.`;

const SYSTEM_CORRIGIR_UI = `Você é o CORRETOR-FRONTEND — Cirurgião de Interface.

## SEU PAPEL NO PIPELINE (Auditor → [VOCÊ] → re-auditoria) 
Corrija problemas visuais e funcionais. Preserve layout e estilo que funcionam.

## RegressionGuardToolkit
- Teste mental: o fix afeta outro componente?
- Preserve responsividade mobile
- Mantenha acessibilidade (ARIA, contraste)

Retorne HTML COMPLETO corrigido. ZERO markdown.`;

const SYSTEM_CORRIGIR_ARQUITETURA = `Você é o CORRETOR-ARQUITETURA — Cirurgião de Design de Sistemas.

## ConsistencyToolkit
- Corrija inconsistências entre tabelas, endpoints e regras de negócio
- Preserve decisões arquiteturais válidas
- Ajuste apenas o que o Auditor apontou

Retorne JSON COMPLETO da arquitetura corrigida. ZERO markdown.`;

async function corrigirSQL(sql, problemas) {
    const problemasStr = problemas
        .filter(p => p.local === 'SQL' || p.local === 'Arquitetura')
        .map(p => `- [${p.gravidade}] ${p.descricao}\n  Como corrigir: ${p.como_corrigir || 'N/A'}`)
        .join('\n');

    if (!problemasStr.trim()) return sql; // Sem problemas no SQL, retorna igual

    const prompt = `Problemas a corrigir:\n${problemasStr}\n\nSQL atual:\n${sql}`;
    return await chamarIACodigo(SYSTEM_CORRIGIR_SQL, prompt, 3000);
}

async function corrigirApp(app, problemas, arquitetura) {
    const problemasStr = problemas
        .filter(p => p.local === 'App' || p.local === 'Segurança' || p.local === 'Backend')
        .map(p => `- [${p.gravidade}] ${p.descricao}\n  Como corrigir: ${p.como_corrigir || 'N/A'}`)
        .join('\n');

    if (!problemasStr.trim()) return app;

    const prompt = `Problemas a corrigir:\n${problemasStr}\n\nArquitetura de referência:\n${JSON.stringify(arquitetura).substring(0, 1000)}\n\nApp atual:\n${app}`;
    return await chamarIACodigo(SYSTEM_CORRIGIR_APP, prompt, 4000);
}

async function corrigirUI(ui, problemas) {
    const problemasStr = problemas
        .filter(p => p.local === 'UI' || p.local === 'Frontend' || p.local === 'Design')
        .map(p => `- [${p.gravidade}] ${p.descricao}\n  Como corrigir: ${p.como_corrigir || 'N/A'}`)
        .join('\n');

    if (!problemasStr.trim()) return ui;

    const prompt = `Problemas a corrigir:\n${problemasStr}\n\nUI atual:\n${ui}`;
    return await chamarIACodigo(SYSTEM_CORRIGIR_UI, prompt, 4000);
}

async function corrigirArquitetura(arquitetura, problemas) {
    const problemasStr = problemas
        .filter(p => p.local === 'Arquitetura' || p.gravidade === 'critica')
        .map(p => `- [${p.gravidade}] ${p.descricao}\n  Como corrigir: ${p.como_corrigir || 'N/A'}`)
        .join('\n');

    if (!problemasStr.trim()) return arquitetura;

    const prompt = `Problemas a corrigir:\n${problemasStr}\n\nArquitetura atual:\n${JSON.stringify(arquitetura, null, 2).substring(0, 3000)}`;
    const resposta = await chamarIARaciocinio(SYSTEM_CORRIGIR_ARQUITETURA, prompt, 3000);

    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : arquitetura;
}

/**
 * Corrige todos os artefatos de uma vez baseado no relatório do Auditor
 */
async function corrigirTudo({ arquitetura, sql, app, ui }, auditoria) {
    const problemas = auditoria.problemas || [];
    const temProblemaArquitetura = problemas.some(p =>
        p.local === 'Arquitetura' || p.gravidade === 'critica'
    );

    console.log(`[Corretor] Corrigindo ${problemas.length} problema(s): ${problemas.map(p => `${p.local}(${p.gravidade})`).join(', ')}`);

    // Corrige arquitetura primeiro se necessário (base para os outros)
    const arquiteturaCorrigida = temProblemaArquitetura
        ? await corrigirArquitetura(arquitetura, problemas)
        : arquitetura;

    // Corrige cada artefato em paralelo (mais rápido)
    const [sqlCorrigido, appCorrigido, uiCorrigida] = await Promise.all([
        sql ? corrigirSQL(sql, problemas) : Promise.resolve(null),
        app ? corrigirApp(app, problemas, arquiteturaCorrigida) : Promise.resolve(null),
        ui  ? corrigirUI(ui, problemas)  : Promise.resolve(null)
    ]);

    console.log(`[Corretor] ✅ Correções aplicadas`);

    return {
        arquitetura: arquiteturaCorrigida,
        sql:  sqlCorrigido,
        app:  appCorrigido,
        ui:   uiCorrigida
    };
}

module.exports = { corrigirTudo, corrigirSQL, corrigirApp, corrigirUI, corrigirArquitetura };
