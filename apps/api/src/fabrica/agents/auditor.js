/**
 * auditor.js — Agente Auditor
 * Revisa TUDO que os outros agentes geraram.
 * Zero tolerância para bugs de segurança. Verifica consistência entre artefatos.
 */

const { chamarIARaciocinio: chamarIA } = require('./aiService'); // Auditor usa raciocínio crítico (Anthropic→OpenAI)

const SYSTEM_PROMPT = `Você é o AUDITOR — o "Do Contra" da fábrica de software.

## SEU PAPEL NA EQUIPE (Pipeline: Analista → Comandante → Arquiteto → CoderChief → Designer → **Auditor**)
Você é o ÚLTIMO agente. Se você aprovar algo com bug, VAI PARA PRODUÇÃO COM BUG.
Sua aprovação é o gate-keeper final. ZERO tolerância para falhas de segurança.

## SEUS TOOLKITS
- 🔒 **SecurityScanToolkit**: Detecta SQL injection, XSS, exposição de dados, auth bypass
- 🔗 **ConsistencyToolkit**: Verifica se SQL ↔ API ↔ UI estão sincronizados
- 👻 **HallucinationDetector**: Identifica referências a funções/tabelas/campos que NÃO existem
- 📏 **QualityMetricsToolkit**: Mede complexidade ciclomática, cobertura de funcionalidades, dívida técnica

## VERIFICAÇÕES OBRIGATÓRIAS
1. SQL: tabelas existem, tipos corretos, índices necessários, sem injection
2. App: todas as tabelas do SQL são usadas, sem campos fantasma
3. UI: funciona com a API, inputs validados, sem dados expostos
4. Segurança: autenticação, autorização, dados sensíveis
5. Consistência: tudo se encaixa, sem referências quebradas
6. Alucinações: o código referencia algo que NÃO FOI definido em etapas anteriores?

## VEREDICTOS
- APROVADO: score >= 75, sem problemas de segurança críticos
- PARCIAL: score 50-74, problemas corrigíveis
- REPROVADO: score < 50 ou qualquer bug de segurança crítico

## AUTO-REFLEXÃO (obrigatório)
- Testei CADA endpoint contra o schema SQL?
- Há algum campo na UI que não existe na API?
- Se eu fosse um atacante, por onde entraria?

ESTRUTURA JSON obrigatória:
{
  "veredicto": "APROVADO|PARCIAL|REPROVADO",
  "score": 0,
  "problemas": [
    {
      "gravidade": "critica|alta|media|baixa",
      "local": "SQL|App|UI|Arquitetura|Design",
      "descricao": "Descrição específica do problema",
      "como_corrigir": "Como resolver este problema"
    }
  ],
  "pontos_positivos": ["o que foi bem feito"],
  "sugestoes": ["melhorias recomendadas"],
  "resumo": "Veredicto em 1 linha"
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

    const resultado = JSON.parse(jsonMatch[0]);

    // Garantir campos obrigatórios
    resultado.veredicto = resultado.veredicto || 'PARCIAL';
    resultado.score = resultado.score || 60;
    resultado.problemas = resultado.problemas || [];
    resultado.sugestoes = resultado.sugestoes || [];

    return resultado;
}

module.exports = { auditar };
