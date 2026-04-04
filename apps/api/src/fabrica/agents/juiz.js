/**
 * juiz.js — O Guardião da Verdade e Segurança do Nexus v1.0
 */

const { chamarIAAnalise: chamarIA } = require('./aiService');
const juizSkill = require('../../skills/agentes/Juiz.json');

const SYSTEM_PROMPT = `
${juizSkill.descricao}

REGRAS DE OURO:
${juizSkill.regras_de_ouro.join('\n')}

VOCÊ É O ÚLTIMO FILTRO. Se houver qualquer mentira, alucinação ou risco sistêmico, você deve REPROVAR a entrega.
Seja brutalmente honesto. É melhor uma verdade que dói que uma mentira que agrada.
`;

const JuizAgent = {
  /**
   * Realiza a Revisão Judicial da entrega final.
   */
  async julgar(projeto, auditoriaTecnica) {
    const prompt = `
PROJETO: ${projeto.nome} (${projeto.tipo})
IDEIA ORIGINAL: ${projeto.ideia_original}

RESULTADO DA AUDITORIA TÉCNICA:
- Score: ${auditoriaTecnica.score}/100
- Veredicto: ${auditoriaTecnica.veredicto}
- Problemas Detectados: ${JSON.stringify(auditoriaTecnica.problemas)}

RELATÓRIO DE ARTEFATOS:
- Possui SQL: ${!!projeto.codigo_sql}
- Possui App: ${!!projeto.codigo_app}
- Possui UI: ${!!projeto.codigo_ui}
- Possui Docs: ${!!projeto.documentacao}

TAREFA:
Analise se o sistema cumpriu a promessa original sem mentir ou alucinar.
Responda em formato JSON:
{
  "honesto": boolean,
  "veredicto": "APROVADO_JUDICIAL" | "REPROVADO_POR_MENTIRA" | "AJUSTE_MORAL_NECESSARIO",
  "riscos_detectados": [],
  "observacao_para_o_usuario": "Sua mensagem bruta e direta aqui",
  "conselho_nexus": "Conselho de evolução para o próprio sistema não errar de novo"
}
`;

    try {
      const resposta = await chamarIA(SYSTEM_PROMPT, prompt, 3000);
      const jsonMatch = resposta.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Juiz falhou ao emitir sentença formatada.");
      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("[Juiz] Erro fatal na sentença:", err.message);
      return { 
        honesto: false, 
        veredicto: "ERRO_JUDICIAL", 
        observacao_para_o_usuario: "O Juiz foi silenciado por um erro técnico. Recomenda-se cautela máxima." 
      };
    }
  }
};

module.exports = JuizAgent;
