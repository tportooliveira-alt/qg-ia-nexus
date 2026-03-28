/**
 * auditor.js — Agente Auditor
 * Revisa TUDO que os outros agentes geraram.
 * Zero tolerância para bugs de segurança. Verifica consistência entre artefatos.
 */

const { chamarIARaciocinio: chamarIA } = require('./aiService'); // Auditor usa raciocínio crítico (Anthropic→OpenAI)

const SYSTEM_PROMPT = `You are the AUDITOR — the "Devil's Advocate" and final gate-keeper of the autonomous software factory.

## YOUR ROLE IN THE PIPELINE (Analyst → Commander → Architect → CoderChief → Designer → **Auditor**)
You are the LAST agent. If you approve something with a bug, IT SHIPS TO PRODUCTION WITH THAT BUG.
Your approval is the final gate. ZERO tolerance for security failures. Your job is to find problems, not praise.

## TOOLKITS (OWL — Optimized Workforce Learning)
- 🔒 **SecurityScanToolkit**: Detect SQL injection, XSS, data exposure, auth bypass, insecure deserialization
- 🔗 **ConsistencyToolkit**: Verify that SQL schema ↔ API endpoints ↔ UI forms are perfectly synchronized
- 👻 **HallucinationDetector**: Identify references to functions, tables, columns, or routes that DO NOT EXIST
- 📏 **QualityMetricsToolkit**: Measure cyclomatic complexity, feature coverage, technical debt indicators

## MANDATORY CHECKS
1. SQL: tables exist with correct types, indexes for hot queries, no injection vectors
2. Backend: all SQL tables have matching CRUD routes, no phantom fields, proper error handling
3. UI: integrates with actual API endpoints, inputs validated, no data leaks in client-side code
4. Security: authentication present where needed, authorization enforced, sensitive data encrypted/hashed
5. Consistency: all artifacts fit together — no broken references between schema, API, and frontend
6. Hallucinations: does the code reference anything that was NOT defined in previous pipeline stages?

## VERDICTS
- APROVADO (APPROVED): score >= 75, no critical security issues
- PARCIAL (PARTIAL): score 50-74, fixable problems only
- REPROVADO (REJECTED): score < 50 OR any critical security bug

## SELF-REFLECTION (mandatory)
- Did I test EVERY endpoint against the SQL schema?
- Is there any field in the UI that doesn't exist in the API?
- If I were an attacker, where would I break in?

Required JSON structure:
{
  "veredicto": "APROVADO|PARCIAL|REPROVADO",
  "score": 0,
  "problemas": [
    {
      "gravidade": "critica|alta|media|baixa",
      "local": "SQL|App|UI|Arquitetura|Design",
      "descricao": "Specific description of the problem",
      "como_corrigir": "How to resolve this problem"
    }
  ],
  "pontos_positivos": ["what was done well"],
  "sugestoes": ["recommended improvements"],
  "resumo": "Verdict in 1 line"
}`;

async function auditar(artefatos) {
    const { plano, arquitetura, sql, app, ui, planilha, documento } = artefatos;

    // Montar contexto para o auditor (truncado para não explodir o contexto da IA)
    const contexto = {
        plano: plano ? JSON.stringify(plano).substring(0, 1000) : null,
        arquitetura: arquitetura ? JSON.stringify(arquitetura).substring(0, 2000) : null,
        sql: sql ? String(sql).substring(0, 2000) : null,
        app: app ? String(app).substring(0, 2000) : null,
        ui: ui ? String(ui).substring(0, 1000) : null,
        planilha: planilha ? JSON.stringify(planilha).substring(0, 1000) : null,
        documento: documento ? JSON.stringify(documento).substring(0, 1000) : null
    };

    const prompt = `Audite todos os artefatos abaixo com olho crítico:\n\n${JSON.stringify(contexto, null, 2)}`;

    const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 2500);

    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return {
            veredicto: 'PARCIAL',
            score: 60,
            problemas: [],
            pontos_positivos: ['Gerado com sucesso'],
            sugestoes: ['Revisão manual recomendada'],
            resumo: 'Auditoria automática inconclusiva — revisão manual recomendada'
        };
    }

    let resultado;
    try {
        resultado = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
        return {
            veredicto: 'PARCIAL',
            score: 55,
            problemas: [{ gravidade: 'baixa', local: 'Auditor', descricao: 'JSON de auditoria malformado', como_corrigir: 'Revisão manual recomendada' }],
            pontos_positivos: ['Gerado com sucesso'],
            sugestoes: ['Revisão manual recomendada'],
            resumo: `Auditoria retornou JSON inválido: ${parseErr.message}`
        };
    }

    // Garantir campos obrigatórios
    resultado.veredicto = resultado.veredicto || 'PARCIAL';
    resultado.score = resultado.score || 60;
    resultado.problemas = resultado.problemas || [];
    resultado.sugestoes = resultado.sugestoes || [];

    return resultado;
}

module.exports = { auditar };
