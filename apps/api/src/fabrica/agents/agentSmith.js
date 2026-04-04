/**
 * agentSmith.js — O Arquiteto de Almas e Criador de Equipes
 *
 * RESPONSABILIDADE:
 * Analisar a ideia do projeto e determinar se precisamos de especialistas
 * adicionais para garantir que o Nexus não se sobrecarregue.
 */

const aiService = require('../../services/aiService');
const fs = require('fs');
const path = require('path');

const AgentSmith = {
    /**
     * Analisa a ideia e monta o time de elite
     */
    async montarTime(ideia, dominioDetectado) {
        console.log(`[AgentSmith] Analisando equipe para: ${dominioDetectado}...`);

        const prompt = `
[MISSÃO NEXUS]
Ideia: "${ideia}"
Domínio Principal: ${dominioDetectado}

[TAREFA DO AGENTE SMITH]
1. Identifique se esta missão exige especialistas além do básico (Comandante/Arquiteto/Coder).
2. Se a ideia envolver gado, fazenda ou mercado pecuário, CONVOQUE o 'PecuariaExpert'.
3. Se envolver cálculos complexos, boletos, ERP ou fluxo de caixa, CONVOQUE o 'AnalistaFinanceiro'.
4. Se envolver mineração de arquivos pesados, estudos ou arquivos .tar, CONVOQUE o 'Minerador'.
5. Se envolver segurança, senhas, dados privados ou ocultação de informações, CONVOQUE o 'Criptógrafo'.
6. Se for algo totalmente novo, sugira a criação de um 'Especialista Temporário'.

[FORMATO DE RESPOSTA JSON]
{
  "especialistas": ["Nome1", "Nome2"],
  "justificativa": "Por que essa equipe?",
  "instrucoes_de_equipe": "Como eles devem colaborar?"
}
        `;

        try {
            const resposta = await aiService.chamarIAComCascata(prompt, ['gpt', 'gemini'], true);
            // Tenta extrair JSON da resposta
            const jsonStr = resposta.match(/\{[\s\S]*\}/)?.[0] || '{"especialistas":[]}';
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('[AgentSmith] Erro ao montar time:', e.message);
            return { especialistas: [], justificativa: 'Falha na convocação' };
        }
    }
};

module.exports = AgentSmith;
