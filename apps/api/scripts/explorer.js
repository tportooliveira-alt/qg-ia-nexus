    // â”€â”€â”€ EXPLORADOR TÃ‰CNICO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const SYSTEM_EXPLORADOR = `VocÃª Ã© o Explorador TÃ©cnico de um squad de agentes IA. VocÃª tem acesso a busca real-time na web.
Sua missÃ£o: monitorar lanÃ§amentos de IAs, MCPs, APIs gratuitas e tÃ©cnicas de prompt engineering para manter o squad atualizado.

CONHECIMENTO INTERNO DO SQUAD:
- Provedores atuais: Claude Sonnet 4.6, Gemini 2.5 Flash, DeepSeek Chat, Groq Llama, Cerebras, GPT-4o-mini
- Stack do sistema: HTML + Vanilla JS + Tailwind CDN (frontend), Node.js + Supabase (backend)
- EspecializaÃ§Ã£o dos agentes: Claudeâ†’raciocÃ­nio, Geminiâ†’pesquisa/grounding, DeepSeekâ†’cÃ³digo, Groq/Cerebrasâ†’velocidade

COMO CLAUDE FUNCIONA INTERNAMENTE (vocÃª sabe isso melhor que ninguÃ©m):
- Claude processa instruÃ§Ã£o + contexto de uma vez (nÃ£o tem streaming de pensamento para o usuÃ¡rio)
- Funciona melhor com instruÃ§Ãµes estruturadas (bullets, seÃ§Ãµes claramente definidas)
- Tem capacidade de "extended thinking" em versÃµes especÃ­ficas
- Context window: 200k tokens (Sonnet 4.6)
- Tool use nativo: pode chamar funÃ§Ãµes, ler arquivos, executar cÃ³digo
- Fraqueza: nÃ£o tem acesso Ã  internet por si sÃ³ â€” precisa de Grounding ou ferramentas externas
- ForÃ§a Ãºnica: seguir instruÃ§Ãµes longas e complexas com precisÃ£o cirÃºrgica

Retorne SOMENTE JSON vÃ¡lido no formato especificado.`;

    async function rodarExploradorTecnico() {
      const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      const userPrompt = `Data de hoje: ${hoje}

FaÃ§a uma pesquisa real na web e me traga um briefing tÃ©cnico completo sobre:
1. Novos modelos de IA lanÃ§ados ou anunciados nos Ãºltimos 30 dias (OpenAI, Anthropic, Google, Meta, DeepSeek, Mistral, etc.)
2. Novos MCPs (Model Context Protocol) publicados que podem ser usados com Claude Code
3. APIs gratuitas ou com free tier generoso lanÃ§adas recentemente (qualquer categoria Ãºtil para devs)
4. MudanÃ§as de preÃ§o nos provedores de IA que afetam nosso squad
5. Novas tÃ©cnicas de prompt engineering ou achados de pesquisa sobre como melhorar agentes

Para cada item encontrado, avalie se Ã© relevante para nosso sistema e sugira uma aÃ§Ã£o concreta.

Retorne SOMENTE este JSON:
{
  "data_briefing": "${hoje}",
  "novidades": [
    { "tipo": "modelo|mcp|api|tecnica|preco", "titulo": "...", "descricao": "...", "impacto": "alto|medio|baixo", "url_referencia": "...", "acao_recomendada": "..." }
  ],
  "recomendacoes_squad": [
    { "agente": "nome do agente ou 'callCascata'", "melhoria": "o que mudar e por quÃª" }
  ],
  "alertas": ["Algum provedor fora do ar?", "Algum preÃ§o aumentou?"],
  "resumo_executivo": "2-3 frases resumindo o estado da arte desta semana"
}`;

      mostrarLoading('🔭 Explorador pesquisando na web...', 'Usando Orquestrador com Grounding para busca real-time · Pode levar 30s');
      try {
        const res = await callCascata(SYSTEM_EXPLORADOR, userPrompt, ['Gemini', 'Anthropic', 'DeepSeek', 'Groq']);
        const briefing = typeof res === 'string' ? extrairJSON(res) : res;
        esconderLoading();

        // Salva como memÃ³ria dos agentes
        if (briefing?.resumo_executivo) {
          await agentesAprender('Explorador', `[Briefing ${briefing.data_briefing}] ${briefing.resumo_executivo}`, 'Squad');
        }
        if (Array.isArray(briefing?.novidades)) {
          for (const n of briefing.novidades.filter(n => n.impacto === 'alto').slice(0, 3)) {
            await agentesAprender('Explorador', `ðŸš¨ ${n.titulo}: ${n.acao_recomendada}`, 'Squad');
          }
        }

        exibirBriefingExplorador(briefing);
        mostrarToast(`ðŸ”­ Briefing atualizado! ${briefing?.novidades?.length || 0} novidades encontradas`);
      } catch(e) {
        esconderLoading();
        mostrarToast('Explorador precisa de chave Gemini configurada', 'erro');
      }
    }

    function exibirBriefingExplorador(briefing) {
      const impactoCor = { alto: 'rose', medio: 'amber', baixo: 'zinc' };
      const tipoEmoji = { modelo: 'ðŸ¤–', mcp: 'ðŸ”Œ', api: 'âš¡', tecnica: 'ðŸ§ª', preco: 'ðŸ’°' };
      const novidades = (briefing?.novidades || []).map(n => `
        <div class="bg-${impactoCor[n.impacto] || 'zinc'}-900/20 border border-${impactoCor[n.impacto] || 'zinc'}-800/30 rounded-xl p-3">
          <div class="flex items-start justify-between gap-2 mb-1">
            <span class="font-semibold text-sm text-white">${tipoEmoji[n.tipo] || 'ðŸ“Œ'} ${n.titulo}</span>
            <span class="text-[10px] font-bold text-${impactoCor[n.impacto] || 'zinc'}-400 uppercase shrink-0">${n.impacto}</span>
          </div>
          <p class="text-xs text-zinc-400 mb-2">${n.descricao}</p>
          <p class="text-xs text-emerald-400 font-medium">â†’ ${n.acao_recomendada}</p>
        </div>`).join('');

      const recomendacoes = (briefing?.recomendacoes_squad || []).map(r =>
        `<div class="flex gap-2 text-xs"><span class="text-violet-400 font-bold shrink-0">${r.agente}:</span><span class="text-zinc-300">${r.melhoria}</span></div>`
      ).join('');

      const html = `<div class="space-y-4">
        <div class="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-4">
          <p class="text-xs font-bold text-emerald-400 mb-1">ðŸ“‹ RESUMO EXECUTIVO</p>
          <p class="text-sm text-zinc-200">${briefing?.resumo_executivo || ''}</p>
        </div>
        ${briefing?.alertas?.length ? `<div class="bg-red-900/20 border border-red-800/30 rounded-xl p-3"><p class="text-xs font-bold text-red-400 mb-1">ðŸš¨ ALERTAS</p>${briefing.alertas.map(a => `<p class="text-xs text-zinc-300">â€¢ ${a}</p>`).join('')}</div>` : ''}
        <div><p class="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Novidades (${briefing?.novidades?.length || 0})</p><div class="space-y-2">${novidades}</div></div>
        ${recomendacoes ? `<div><p class="text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">RecomendaÃ§Ãµes para o Squad</p><div class="space-y-1.5">${recomendacoes}</div></div>` : ''}
        <p class="text-[10px] text-zinc-600 text-center">Aprendizados salvos na memÃ³ria do squad Â· DisponÃ­veis em ðŸ§ </p>
      </div>`;

      // Abre o modal de memÃ³rias mostrando o briefing
      const el = document.getElementById('modal-memorias');
      const body = document.getElementById('modal-memorias-body');
      if (el && body) {
        body.innerHTML = html;
        el.classList.remove('hidden'); el.classList.add('flex');
      }
    }


