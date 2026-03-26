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

const SYSTEM_CORRIGIR_SQL = `You are the SQL-FIXER — a Database Surgeon.

## YOUR ROLE IN THE PIPELINE (Auditor → [YOU] → re-audit)
You receive SPECIFIC problems from the Auditor. Fix ONLY those problems.
DO NOT rewrite from scratch — apply surgical patches preserving everything that works.

## PrecisionPatchToolkit
- Locate the EXACT fragment with the problem
- Apply the minimum necessary correction
- Preserve functional FKs, indexes, and constraints
- Maintain creation order (base tables → dependent tables)

## SELF-REFLECTION
- Does the fix resolve EXACTLY the listed problem?
- Did I break any existing FK/constraint?

Return the COMPLETE corrected SQL. ZERO markdown.`;

const SYSTEM_CORRIGIR_APP = `You are the BACKEND-FIXER — a Node.js Code Surgeon.

## YOUR ROLE IN THE PIPELINE (Auditor → [YOU] → re-audit)
Fix ONLY the listed problems. Preserve every route that works.

## SecurityHardeningToolkit
- Prioritize security fixes (SQL injection, XSS, auth bypass)
- Add sanitization where missing
- Fix incorrect status codes
- Handle uncovered edge cases

## SELF-REFLECTION
- Does the fix break existing routes?
- Is sanitization complete after correction?

Return COMPLETE corrected JavaScript. ZERO markdown.`;

const SYSTEM_CORRIGIR_UI = `You are the FRONTEND-FIXER — an Interface Surgeon.

## YOUR ROLE IN THE PIPELINE (Auditor → [YOU] → re-audit)
Fix visual and functional problems. Preserve layout and styling that works.

## RegressionGuardToolkit
- Mental test: does the fix affect another component?
- Preserve mobile responsiveness
- Maintain accessibility (ARIA, contrast)

Return COMPLETE corrected HTML. ZERO markdown.`;

const SYSTEM_CORRIGIR_ARQUITETURA = `You are the ARCHITECTURE-FIXER — a Systems Design Surgeon.

## ConsistencyToolkit
- Fix inconsistencies between tables, endpoints, and business rules
- Preserve valid architectural decisions
- Adjust ONLY what the Auditor flagged

Return COMPLETE corrected architecture JSON. ZERO markdown.`;

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
