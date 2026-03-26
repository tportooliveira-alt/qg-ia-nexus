/**
 * fixer.js — Agente Corretor
 * Especializado em receber o feedback do Auditor e CORRIGIR cada problema.
 * Trabalha com cirurgia de precisão: não reescreve tudo, corrige o que está errado.
 */

const { chamarIACodigo, chamarIARaciocinio } = require('./aiService');

const SYSTEM_CORRIGIR_SQL = `Você é um DBA expert. Recebeu código SQL com problemas específicos.
Corrija APENAS os problemas listados. Retorne o SQL COMPLETO corrigido.
Sem markdown, sem explicações. Apenas o SQL puro.`;

const SYSTEM_CORRIGIR_APP = `Você é um programador Node.js sênior. Recebeu código de backend com problemas.
Corrija APENAS os problemas listados. Retorne o código JavaScript COMPLETO corrigido.
Sem markdown, sem explicações. Apenas o código.`;

const SYSTEM_CORRIGIR_UI = `Você é um frontend sênior. Recebeu código HTML/CSS/JS com problemas.
Corrija APENAS os problemas listados. Retorne o HTML COMPLETO corrigido.
Sem markdown, sem explicações. Apenas o código HTML.`;

const SYSTEM_CORRIGIR_ARQUITETURA = `Você é um arquiteto de sistemas sênior.
Recebeu uma arquitetura com problemas. Corrija APENAS os problemas listados.
Retorne o JSON COMPLETO da arquitetura corrigida. Sem markdown.`;

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
