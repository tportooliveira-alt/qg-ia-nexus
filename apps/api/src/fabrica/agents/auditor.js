/**
 * auditor.js — Agente Auditor v3.0 (Validação Real + IA)
 * 
 * MUDANÇA CRÍTICA v3.0:
 * Antes: só pedia opinião da IA → score inflado, código bugado passava.
 * Agora: validação DETERMINÍSTICA primeiro (sintaxe, estrutura) → depois IA opina.
 * 
 * PIPELINE: CoderChief → Designer → **[AUDITOR]** → Corretor (se reprovado)
 * O Auditor é o ÚLTIMO portão. Se aprovar com bug, VAI PRA PRODUÇÃO com bug.
 */

const { chamarIARaciocinio, chamarIAPremium } = require('./aiService');

const SYSTEM_PROMPT = `You are the AUDITOR — the "Devil's Advocate" and final gate-keeper of the autonomous software factory.

## YOUR ROLE IN THE PIPELINE (Analyst → Commander → Architect → CoderChief → Designer → **Auditor**)
You are the LAST agent. If you approve something with a bug, IT SHIPS TO PRODUCTION WITH THAT BUG.
Your approval is the final gate. ZERO tolerance for security failures.

## TOOLKITS (OWL — Optimized Workforce Learning)
- 🔒 **SecurityScanToolkit**: Detect SQL injection, XSS, data exposure, auth bypass
- 🔗 **ConsistencyToolkit**: Verify SQL schema ↔ API endpoints ↔ UI forms are synchronized
- 👻 **HallucinationDetector**: Identify references to non-existent functions/tables/routes
- 📏 **QualityMetricsToolkit**: Feature coverage, error handling, technical debt

## MANDATORY CHECKS
1. SQL: tables with correct types, indexes, no injection vectors
2. Backend: all tables have CRUD routes, proper error handling
3. UI: integrates with actual API endpoints, inputs validated
4. Security: auth present, authorization enforced
5. Consistency: no broken references between schema, API, and frontend
6. Hallucinations: does code reference undefined things?

## IMPORTANT: PRE-VALIDATION PENALTIES
The system has already applied deterministic penalties for structural issues.
Those penalties are FINAL — do NOT increase the score if the code has structural failures.
Your job is to find ADDITIONAL problems the automated check missed.

## VERDICTS
- APROVADO: score >= 80, no critical security issues
- PARCIAL: score 50-79, fixable problems only
- REPROVADO: score < 50 OR any critical security bug

Required JSON:
{
  "veredicto": "APROVADO|PARCIAL|REPROVADO",
  "score": 0,
  "problemas": [{"gravidade":"critica|alta|media|baixa","local":"SQL|App|UI|Arquitetura|Design","descricao":"...","como_corrigir":"..."}],
  "pontos_positivos": ["..."],
  "sugestoes": ["..."],
  "resumo": "Verdict in 1 line"
}`;

// ─── Validação Determinística (ANTES da IA) ──────────────────────────────────
// Checa problemas estruturais reais no código, sem depender de opinião de IA.
function validacaoSintatica(artefatos) {
    const penalidades = [];
    let penTotal = 0;

    // ── SQL ───────────────────────────────────────────────────────────────────
    if (artefatos.sql) {
        const sql = String(artefatos.sql);
        // Código veio como markdown ao invés de SQL puro?
        if (sql.startsWith('```') || sql.startsWith('# ')) {
            penalidades.push({ gravidade: 'critica', local: 'SQL', descricao: 'SQL contém markdown/code-fences ao invés de SQL puro', como_corrigir: 'Remover ``` e retornar apenas SQL executável' });
            penTotal += 35;
        }
        if (!sql.includes('CREATE TABLE') && !sql.includes('create table')) {
            penalidades.push({ gravidade: 'critica', local: 'SQL', descricao: 'SQL não contém nenhum CREATE TABLE', como_corrigir: 'Gerar CREATE TABLE para todas as tabelas da arquitetura' });
            penTotal += 30;
        }
    }

    // ── Backend/App ──────────────────────────────────────────────────────────
    if (artefatos.app) {
        const app = String(artefatos.app);
        if (app.startsWith('```') || app.startsWith('# ')) {
            penalidades.push({ gravidade: 'critica', local: 'App', descricao: 'Backend contém markdown/code-fences ao invés de JavaScript puro', como_corrigir: 'Retornar apenas código JS executável' });
            penTotal += 35;
        }
        if (!app.includes('express') && !app.includes('http') && !app.includes('server')) {
            penalidades.push({ gravidade: 'alta', local: 'App', descricao: 'Backend não contém express(), http ou server — não é um servidor válido', como_corrigir: 'Incluir require("express") e app.listen()' });
            penTotal += 20;
        }
        if (!app.includes('listen') && !app.includes('module.exports')) {
            penalidades.push({ gravidade: 'alta', local: 'App', descricao: 'Backend sem listen() ou module.exports — código não executável', como_corrigir: 'Adicionar app.listen(PORT) no final' });
            penTotal += 15;
        }
        // Verificar se tem rotas
        const temRotas = app.includes('.get(') || app.includes('.post(') || app.includes('.put(') || app.includes('.delete(') || app.includes('router.');
        if (!temRotas) {
            penalidades.push({ gravidade: 'alta', local: 'App', descricao: 'Backend sem nenhuma rota HTTP (GET/POST/PUT/DELETE)', como_corrigir: 'Implementar rotas CRUD para as tabelas' });
            penTotal += 15;
        }
    }

    // ── UI/Frontend ──────────────────────────────────────────────────────────
    if (artefatos.ui) {
        const ui = String(artefatos.ui);
        if (ui.startsWith('```') || ui.startsWith('# ')) {
            penalidades.push({ gravidade: 'critica', local: 'UI', descricao: 'UI contém markdown/code-fences ao invés de HTML', como_corrigir: 'Retornar apenas HTML completo' });
            penTotal += 35;
        }
        if (!ui.includes('<html') && !ui.includes('<!DOCTYPE') && !ui.includes('<div') && !ui.includes('React')) {
            penalidades.push({ gravidade: 'alta', local: 'UI', descricao: 'UI não contém HTML válido (<html>, <!DOCTYPE> ou componentes React)', como_corrigir: 'Gerar HTML completo com <!DOCTYPE html>' });
            penTotal += 20;
        }
        if (!ui.includes('fetch(') && !ui.includes('axios') && !ui.includes('XMLHttpRequest')) {
            penalidades.push({ gravidade: 'media', local: 'UI', descricao: 'UI não faz chamada à API backend (sem fetch/axios)', como_corrigir: 'Integrar com endpoints do backend via fetch()' });
            penTotal += 10;
        }
    }

    // ── Checagens cruzadas ────────────────────────────────────────────────────
    if (artefatos.sql && artefatos.app) {
        const sql = String(artefatos.sql).toLowerCase();
        const app = String(artefatos.app).toLowerCase();
        // Se SQL tem tabelas mas backend não referencia nenhuma
        const tabelas = sql.match(/create table\s+(\w+)/gi) || [];
        const tabelasNomes = tabelas.map(t => t.replace(/create table\s+/i, '').toLowerCase());
        const backendRefTabelas = tabelasNomes.filter(t => app.includes(t));
        if (tabelasNomes.length > 0 && backendRefTabelas.length === 0) {
            penalidades.push({ gravidade: 'alta', local: 'App', descricao: `Backend não referencia nenhuma das ${tabelasNomes.length} tabelas SQL`, como_corrigir: 'Implementar rotas CRUD para as tabelas definidas no SQL' });
            penTotal += 15;
        }
    }

    return { penalidades, penTotal: Math.min(penTotal, 80) }; // Cap at 80 — always leave room for IA
}

// ─── Pipeline de Auditoria ────────────────────────────────────────────────────

async function auditar(artefatos) {
    const { plano, arquitetura, sql, app, ui, planilha, documento, nivel = 'normal', historicoIteracoes = [] } = artefatos;

    // ── PASSO 1: Validação determinística (sem IA, instantâneo) ───────────
    const { penalidades, penTotal } = validacaoSintatica({ sql, app, ui });

    if (penalidades.length > 0) {
        console.log(`[Auditor] ⚡ Validação sintática: ${penalidades.length} problemas, -${penTotal} pontos`);
    }

    // ── PASSO 2: Auditoria via IA ────────────────────────────────────────────
    const chamarIA = nivel === 'premium' ? chamarIAPremium : chamarIARaciocinio;

    const contexto = {
        plano: plano ? JSON.stringify(plano).substring(0, 1000) : null,
        arquitetura: arquitetura ? JSON.stringify(arquitetura).substring(0, 8000) : null,
        sql: sql ? String(sql).substring(0, 8000) : null,
        app: app ? String(app).substring(0, 8000) : null,
        ui: ui ? String(ui).substring(0, 1000) : null,
        planilha: planilha ? JSON.stringify(planilha).substring(0, 1000) : null,
        documento: documento ? JSON.stringify(documento).substring(0, 1000) : null
    };

    // Incluir histórico de iterações anteriores no prompt para evitar loops
    let historico = '';
    if (historicoIteracoes.length > 0) {
        historico = '\n\n--- HISTÓRICO DE ITERAÇÕES ANTERIORES ---\n' +
            historicoIteracoes.map((h, i) => 
                `Iteração ${i+1}: Score ${h.score}/100, Veredicto: ${h.veredicto}, Problemas: ${h.problemas?.length || 0}`
            ).join('\n') +
            '\nATENÇÃO: Não reporte os mesmos problemas que já foram corrigidos nas iterações anteriores.\n' +
            '--- FIM DO HISTÓRICO ---\n';
    }

    // Incluir penalidades determinísticas no prompt
    let penMsg = '';
    if (penTotal > 0) {
        penMsg = `\n\nATENÇÃO: A validação automática já aplicou ${penTotal} pontos de penalidade por problemas estruturais:\n` +
            penalidades.map(p => `- [${p.gravidade}] ${p.local}: ${p.descricao}`).join('\n') +
            '\nSeu score MÁXIMO possível é ' + (100 - penTotal) + '/100. Não ignore esses problemas.\n';
    }

    const prompt = `Audite todos os artefatos abaixo com olho crítico:${penMsg}${historico}\n\n${JSON.stringify(contexto, null, 2)}`;

    let resultado;
    try {
        const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 8000);
        const jsonMatch = resposta.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            resultado = JSON.parse(jsonMatch[0]);
        }
    } catch (err) {
        console.warn(`[Auditor] IA falhou: ${err.message}. Usando validação sintática apenas.`);
    }

    // Fallback se IA falhar
    if (!resultado) {
        resultado = {
            veredicto: penTotal >= 30 ? 'REPROVADO' : 'PARCIAL',
            score: Math.max(100 - penTotal - 20, 20), // -20 extra pela IA ter falhado
            problemas: penalidades,
            pontos_positivos: ['Gerado com sucesso (auditoria IA indisponível)'],
            sugestoes: ['Revisão manual recomendada — IA de auditoria falhou'],
            resumo: `Auditoria via validação sintática apenas. Score: ${100 - penTotal - 20}/100`
        };
        return resultado;
    }

    // ── PASSO 3: Combinar penalidades determinísticas com análise da IA ──────
    resultado.veredicto = resultado.veredicto || 'PARCIAL';
    resultado.score = resultado.score || 60;
    resultado.problemas = resultado.problemas || [];
    resultado.sugestoes = resultado.sugestoes || [];

    // Mesclar problemas: determinísticos + IA (sem duplicar)
    const problemasExistentes = new Set(resultado.problemas.map(p => p.descricao));
    for (const pen of penalidades) {
        if (!problemasExistentes.has(pen.descricao)) {
            resultado.problemas.unshift(pen); // Adiciona no topo (prioridade)
        }
    }

    // Aplicar penalidade determinística ao score da IA
    const scoreCorrigido = Math.max(resultado.score - penTotal, 10);
    resultado.score = scoreCorrigido;

    // Recalcular veredicto com score corrigido
    if (resultado.score >= 80 && !resultado.problemas.some(p => p.gravidade === 'critica')) {
        resultado.veredicto = 'APROVADO';
    } else if (resultado.score >= 50) {
        resultado.veredicto = 'PARCIAL';
    } else {
        resultado.veredicto = 'REPROVADO';
    }

    // Se tem problemas críticos NUNCA aprovar
    if (resultado.problemas.some(p => p.gravidade === 'critica')) {
        if (resultado.veredicto === 'APROVADO') resultado.veredicto = 'PARCIAL';
        resultado.score = Math.min(resultado.score, 74);
    }

    console.log(`[Auditor] 🔍 Score: ${resultado.score}/100 (pen.sintática: -${penTotal}) | Veredicto: ${resultado.veredicto}`);

    return resultado;
}

module.exports = { auditar, validacaoSintatica };
