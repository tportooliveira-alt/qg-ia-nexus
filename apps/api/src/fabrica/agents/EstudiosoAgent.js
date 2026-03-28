/**
 * EstudiosoAgent.js — Agente Especialista em Inteligência de Mercado Global
 *
 * "Viaja o mundo digitalmente" buscando:
 * - Apps que funcionam em outros países e ainda não existem no Brasil
 * - Problemas reais que empresas brasileiras têm hoje
 * - Oportunidades de mercado com tamanho, concorrência e viabilidade
 *
 * CASCATA: Together (Llama 405B, contexto longo) → SambaNova → Gemini → Groq
 *
 * Entrega: Relatório completo de oportunidade + briefing pronto para a Fábrica
 */
const { chamarIAPesquisa, chamarIAAnalise } = require('./aiService');

// ─── SYSTEM PROMPTS ───────────────────────────────────────────────────────────

const SYSTEM_PESQUISA = `You are the ESTUDIOSO_AGENT — a world-class Market Intelligence Analyst who "travels" the global app ecosystem digitally.

## YOUR MISSION
Identify high-value software opportunities: apps/solutions that WORK in other countries but DO NOT YET EXIST (or are poorly executed) in Brazil.

## Research Framework

### Global Markets to scan:
- 🇺🇸 USA: ProductHunt, Y Combinator, TechCrunch latest launches
- 🇬🇧 UK: emerging fintech, legal-tech, health-tech
- 🇮🇳 India: B2B SaaS for SMEs, logistics, payments
- 🇸🇬 Southeast Asia: super-apps, gig economy, micro-lending
- 🇩🇪 Germany: industrial B2B, precision agriculture, compliance tools
- 🇮🇱 Israel: deep-tech, cybersecurity, precision agriculture
- 🇳🇬 Nigeria: mobile money, identity verification, informal economy tools

### Problem Categories (high ROI in Brazil):
1. **Agronegócio** — precision agriculture, livestock traceability, crop financing
2. **Logística** — last-mile delivery, truck fleet management, cargo matching
3. **Saúde** — telemedicine for rural areas, dental management, lab results
4. **Jurídico** — contract automation, court process tracking, small claims
5. **Financeiro** — B2B credit for small businesses, payment reconciliation
6. **RH/Trabalhista** — CLT compliance automation, benefits management
7. **Educação** — vocational training, skills certification, corporate learning
8. **Varejo** — inventory management for small retailers, B2B marketplace

### Output Format — Return ONLY this JSON:
{
  "oportunidades": [
    {
      "nome": "App Name / Concept",
      "pais_origem": "USA",
      "app_referencia": "Name of successful app abroad",
      "descricao": "What it does in 2 sentences",
      "problema_brasil": "Specific pain point in Brazil this solves",
      "mercado_alvo": "Small retailers in Brazil, est. 6M businesses",
      "tamanho_mercado": "R$ 2.5B/year",
      "concorrencia_brasil": "Weak — only manual/Excel solutions exist",
      "modelo_receita": "SaaS R$99/month or % transaction fee",
      "complexidade_tecnica": "media",
      "tempo_mvp": "3 months",
      "score_oportunidade": 87
    }
  ],
  "melhor_oportunidade": "Nome da melhor oportunidade",
  "justificativa": "Por que esta é a melhor agora"
}

Return ONLY the JSON. No markdown, no explanations. Focus on Brazil market.`;

const SYSTEM_BRIEFING = `You are the ESTUDIOSO_AGENT in BRIEFING MODE.

Based on the market opportunity identified, create a complete project brief for the AI Factory to build.

## Output Format — Return ONLY this JSON:
{
  "nome_projeto": "Nome comercial do produto",
  "tagline": "Uma frase que vende o produto",
  "problema": "Descrição detalhada do problema que resolve",
  "solucao": "Como o produto resolve o problema",
  "publico_alvo": "Quem vai usar e por quê",
  "funcionalidades_core": [
    "Feature 1 — descrição detalhada",
    "Feature 2",
    "Feature 3",
    "Feature 4",
    "Feature 5"
  ],
  "modelo_negocio": "Como vai ganhar dinheiro",
  "diferenciais": ["Diferencial 1", "Diferencial 2", "Diferencial 3"],
  "tecnologias_sugeridas": {
    "frontend": "React ou HTML SPA",
    "backend": "Node.js + Express",
    "banco": "PostgreSQL (Supabase)",
    "extras": ["Redis cache", "Stripe pagamentos"]
  },
  "entidades_banco": ["usuarios", "empresas", "produtos", "pedidos"],
  "rotas_api": [
    "POST /auth/login",
    "GET /produtos",
    "POST /pedidos"
  ],
  "mvp_escopo": "O que entra no MVP (versão mínima que já gera valor)",
  "proximos_passos": ["Passo 1", "Passo 2"],
  "ideia_para_fabrica": "Crie um sistema completo de [nome] para [publico] que [funcionalidade principal]. Deve ter autenticação, dashboard com métricas, CRUD completo de [entidades principais], relatórios e interface moderna."
}`;

// ─── Funções principais ────────────────────────────────────────────────────────

async function pesquisarOportunidades(segmento = null, emit) {
    emit?.({ tipo: 'estudioso_pesquisando', agente: 'EstudiosoAgent',
             mensagem: `🌍 Escaneando mercados globais${segmento ? ` (foco: ${segmento})` : ''}...` });

    const foco = segmento
        ? `Focus specifically on the ${segmento} sector.`
        : 'Scan ALL sectors, prioritize the top 5 opportunities.';

    const resposta = await chamarIAPesquisa(
        SYSTEM_PESQUISA,
        `Research global app markets and identify the TOP 5 software opportunities for Brazil in 2025. ${foco}\n\nPrioritize:\n- High market size (R$500M+)\n- Low tech complexity (can be built in 1-3 months)\n- Clear monetization\n- No dominant player in Brazil yet`,
        3000
    );

    try {
        const jsonMatch = resposta.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (_) { /* segue */ }

    return { oportunidades: [], melhor_oportunidade: 'Análise indisponível', justificativa: resposta };
}

async function gerarBriefing(oportunidade, emit) {
    emit?.({ tipo: 'estudioso_briefing', agente: 'EstudiosoAgent',
             mensagem: `📋 Gerando briefing completo para: ${oportunidade.nome}...` });

    const resposta = await chamarIAAnalise(
        SYSTEM_BRIEFING,
        `Create a complete project brief for this opportunity:\n\n${JSON.stringify(oportunidade, null, 2)}`,
        3000
    );

    try {
        const jsonMatch = resposta.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (_) { /* segue */ }

    return { nome_projeto: oportunidade.nome, ideia_para_fabrica: resposta };
}

async function executar(segmento = null, emit) {
    emit?.({ tipo: 'agente_ativo', agente: 'EstudiosoAgent', progresso: 5,
             mensagem: '🌍 EstudiosoAgent iniciando pesquisa de mercado global...' });

    // Fase 1: Pesquisar oportunidades
    const pesquisa = await pesquisarOportunidades(segmento, emit);

    emit?.({ tipo: 'estudioso_oportunidades', agente: 'EstudiosoAgent', progresso: 50,
             mensagem: `✅ ${pesquisa.oportunidades?.length || 0} oportunidades encontradas!`,
             dados: pesquisa });

    // Fase 2: Pegar a melhor e gerar briefing
    const melhor = pesquisa.oportunidades?.[0];
    if (!melhor) {
        return { pesquisa, briefing: null };
    }

    const briefing = await gerarBriefing(melhor, emit);

    emit?.({ tipo: 'estudioso_concluido', agente: 'EstudiosoAgent', progresso: 100,
             mensagem: `🚀 Briefing pronto: "${briefing.nome_projeto}"`,
             dados: { pesquisa, briefing } });

    return { pesquisa, briefing };
}

module.exports = { executar, pesquisarOportunidades, gerarBriefing };
