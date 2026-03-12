    // â”€â”€â”€ AGENTE VIDENTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const SYSTEM_VIDENTE = `VocÃª Ã© o Agente Vidente â€” o olho superdotado do QG IA. VocÃª enxerga o sistema de DOIS Ã¢ngulos simultÃ¢neos:

Ã‚NGULO 1 â€” FRENTE PARA TRÃS (perspectiva do usuÃ¡rio â†’ sistema):
"O usuÃ¡rio vai clicar em X. O que acontece por dentro? Onde pode falhar? O que ele vai sentir?"

Ã‚NGULO 2 â€” TRÃS PARA FRENTE (perspectiva do sistema â†’ usuÃ¡rio):
"O estado atual do sistema Ã© Y. O que isso significa para a experiÃªncia do usuÃ¡rio? O que ele vai ver ou nÃ£o ver?"

VOCÃŠ TEM TRÃŠS MODOS TEMPORAIS:
ðŸ”´ PASSADO: O que aconteceu? Quais padrÃµes de erro? O que a memÃ³ria dos agentes registrou? Onde houve falhas recorrentes?
ðŸŸ¡ PRESENTE: Qual Ã© o estado AGORA? APIs respondendo? Backend acordado? Chaves configuradas? Agentes prontos?
ðŸŸ¢ FUTURO: O que VAI acontecer se nada mudar? Quais limites gratuitos vÃ£o estourar? O que estÃ¡ prestes a falhar? O que vai melhorar?

SOBRE COMO CLAUDE CODE FUNCIONA (vocÃª sabe isso por dentro):
- Claude Code nÃ£o tem memÃ³ria entre sessÃµes â€” cada conversa comeÃ§a do zero
- A Ãºnica ponte Ã© o arquivo MEMORY.md que ele lÃª no inÃ­cio de cada sessÃ£o
- Para Claude Code agir com contexto rico, o briefing precisa ser estruturado e denso
- Claude Code entende melhor: estado atual â†’ problemas â†’ prÃ³ximas aÃ§Ãµes concretas
- Claude Code funciona com: arquivos lidos, cÃ³digo visto, contexto injetado â€” nÃ£o com suposiÃ§Ãµes

SUA SAÃDA Ã‰ SEMPRE UM JSON com esta estrutura:
{
  "timestamp": "...",
  "saude_geral": "verde|amarelo|vermelho",
  "score_sistema": 0-100,
  "diagnostico_presente": {
    "backend": { "status": "online|offline|lento", "latencia_ms": 0, "detalhe": "..." },
    "supabase": { "status": "...", "tabelas": { "projetos": 0, "ideias": 0, "agentes": 0, "memorias": 0 } },
    "chaves_api": { "gemini": true, "anthropic": false, "groq": true, "deepseek": false, "cerebras": false },
    "agentes": { "total": 0, "funcionais": 0, "com_problema": [] },
    "memorias_squad": 0,
    "ultimo_uso": "..."
  },
  "analise_passado": [
    { "tipo": "padrao|erro|sucesso", "descricao": "...", "frequencia": "...", "licao": "..." }
  ],
  "previsao_futuro": [
    { "probabilidade": "alta|media|baixa", "evento": "...", "prazo": "...", "prevencao": "..." }
  ],
  "frente_para_tras": [
    { "acao_usuario": "...", "fluxo_interno": "...", "ponto_critico": "...", "experiencia_resultante": "..." }
  ],
  "tras_para_frente": [
    { "estado_sistema": "...", "impacto_usuario": "...", "visibilidade": "visivel|invisivel|parcial" }
  ],
  "alertas_criticos": ["..."],
  "proximas_acoes_recomendadas": [
    { "prioridade": 1, "acao": "...", "responsavel": "usuario|claude|sistema", "tempo_estimado": "..." }
  ],
  "briefing_para_claude": "Texto markdown denso e estruturado para colar no Claude Code e ele entrar com contexto completo"
}`;

    let _videnterodando = false;
    let _ultimoDiagnostico = null;

    async function rodarVidente(modoTeste = false) {
      if (_videnterodando) return;
      _videnterodando = true;

      abrirModalVidente();
      document.getElementById('vidente-body').innerHTML = `
        <div class="flex flex-col items-center gap-4 py-12">
          <div class="relative w-16 h-16">
            <div class="absolute inset-0 rounded-full border-4 border-violet-500/20 animate-ping"></div>
            <div class="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center text-2xl">ðŸ”®</div>
          </div>
          <div class="text-center">
            <p class="text-white font-semibold">Vidente analisando o sistema...</p>
            <p class="text-xs text-zinc-500 mt-1" id="vidente-status-msg">Checando backend e APIs</p>
          </div>
        </div>`;

      // Coleta dados reais do sistema em paralelo
      const atualizarStatus = msg => {
        const el = document.getElementById('vidente-status-msg');
        if (el) el.textContent = msg;
      };

      const dadosSistema = await coletarDadosSistema(atualizarStatus, modoTeste);
      atualizarStatus('Agente Vidente processando tudo...');

      const ctx = buildContextoPersistente();
      const userPrompt = `${modoTeste ? 'âš ï¸ MODO TESTE ATIVO â€” simule cenÃ¡rios de falha realistas\n\n' : ''}

DADOS REAIS DO SISTEMA COLETADOS AGORA:
${JSON.stringify(dadosSistema, null, 2)}

MEMÃ“RIAS DO SQUAD (Ãºltimas ${_memorias.length}):
${_memorias.slice(0,5).map(m => `[${m.agente}] ${m.conteudo}`).join('\n') || 'Nenhuma ainda'}

CONTEXTO COMPLETO:
${ctx}

Com base nesses dados REAIS, execute a anÃ¡lise completa nos trÃªs tempos (passado/presente/futuro) e nos dois Ã¢ngulos (frenteâ†’trÃ¡s e trÃ¡sâ†’frente).

O campo "briefing_para_claude" deve ser um markdown rico e denso â€” como se fosse uma ficha tÃ©cnica que o Claude Code leria antes de comeÃ§ar a trabalhar. Inclua: estado atual do sistema, problemas identificados, o que estÃ¡ funcionando, o que estÃ¡ quebrado, prÃ³ximas aÃ§Ãµes recomendadas.

Retorne SOMENTE o JSON vÃ¡lido.`;

      try {
        const res = await callCascata(SYSTEM_VIDENTE, userPrompt, ['Anthropic', 'Gemini', 'DeepSeek', 'Groq']);
        const diag = typeof res === 'string' ? extrairJSON(res) : res;
        if (!diag) throw new Error('JSON inválido ou resposta vazia');
        _ultimoDiagnostico = diag;

        // Salva briefing na memÃ³ria dos agentes
        if (diag.briefing_para_claude) {
          await agentesAprender('Vidente', `[DiagnÃ³stico ${new Date().toLocaleDateString('pt-BR')}] Score: ${diag.score_sistema}/100. ${diag.saude_geral === 'vermelho' ? 'ðŸ”´' : diag.saude_geral === 'amarelo' ? 'ðŸŸ¡' : 'ðŸŸ¢'} ${(diag.alertas_criticos||[]).join('; ')}`, 'Squad');
        }

        renderizarDiagnostico(diag, modoTeste);
      } catch(e) {
        document.getElementById('vidente-body').innerHTML = `
          <div class="p-6 text-center">
            <p class="text-red-400 text-sm">Erro no Vidente: ${e.message}</p>
            <p class="text-zinc-500 text-xs mt-2">Configure uma chave de API e tente novamente</p>
          </div>`;
      }
      _videnterodando = false;
    }

    async function coletarDadosSistema(atualizarStatus, modoTeste) {
      const dados = {
        timestamp: new Date().toISOString(),
        modo_teste: modoTeste,
        chaves_configuradas: {
          gemini: !!(localStorage.getItem('io_gemini_key')),
          anthropic: !!(localStorage.getItem('io_anthropic_key')),
          openai: !!(localStorage.getItem('io_openai_key')),
          groq: !!(localStorage.getItem('io_groq_key')),
          cerebras: !!(localStorage.getItem('io_cerebras_key')),
          deepseek: !!(localStorage.getItem('io_deepseek_key'))
        },
        dados_locais: {
          projetos: projetos.length,
          ideias: ideias.length,
          agentes: agentes.length,
          skills: skillsDB.length,
          memorias: _memorias.length
        },
        token_tracker: {
          custo_total_usd: tokenTracker.custo_usd || 0,
          total_chamadas: tokenTracker.chamadas?.length || 0,
          provedores_usados: Object.keys(tokenTracker.por_provedor || {})
        },
        localStorage_size_kb: Math.round(JSON.stringify(localStorage).length / 1024),
        ultimo_briefing: _ultimoDiagnostico?.timestamp || null
      };

      // Testa backend
      atualizarStatus('Testando backend (Render)...');
      const t0 = Date.now();
      const qgToken = localStorage.getItem('qg_auth_token') || '';
      try {
        if (modoTeste) throw new Error('MODO_TESTE');
        const r = await fetch(`${getApiUrl()}/api/status`, { 
          headers: { 'X-QG-Token': qgToken },
          signal: AbortSignal.timeout(5000) 
        });
        const d = await r.json();
        dados.backend = { status: d.status === 'Online' ? 'online' : 'problema', latencia_ms: Date.now() - t0, resposta: d.message };
      } catch(e) {
        dados.backend = { status: modoTeste ? 'simulado_offline' : 'offline', latencia_ms: Date.now() - t0, erro: e.message };
      }

      // Testa Supabase via backend
      atualizarStatus('Verificando Supabase...');
      try {
        if (modoTeste) throw new Error('MODO_TESTE');
        const [rP, rI, rA, rM] = await Promise.allSettled([
          fetch(`${getApiUrl()}/api/projetos`, { headers: { 'X-QG-Token': qgToken } }),
          fetch(`${getApiUrl()}/api/ideias`, { headers: { 'X-QG-Token': qgToken } }),
          fetch(`${getApiUrl()}/api/agentes`, { headers: { 'X-QG-Token': qgToken } }),
          fetch(`${getApiUrl()}/api/memorias?limit=1`, { headers: { 'X-QG-Token': qgToken } })
        ]);
        dados.supabase = {
          status: rP.status === 'fulfilled' ? 'conectado' : 'problema',
          projetos_nuvem: rP.status === 'fulfilled' ? (await rP.value.json()).length : '?',
          ideias_nuvem: rI.status === 'fulfilled' ? (await rI.value.json()).length : '?',
          agentes_nuvem: rA.status === 'fulfilled' ? (await rA.value.json()).length : '?',
          memorias_nuvem: rM.status === 'fulfilled' ? 'ok' : 'sem tabela'
        };
      } catch(e) {
        dados.supabase = { status: 'erro', detalhe: e.message };
      }

      // Analisa padrÃµes de erro no histÃ³rico
      atualizarStatus('Analisando padrÃµes histÃ³ricos...');
      const errosLog = JSON.parse(localStorage.getItem('io_erros_log') || '[]');
      dados.historico_erros = errosLog.slice(-10);

      // Analisa uso de memÃ³ria
      dados.memorias_recentes = _memorias.slice(0, 3).map(m => ({ agente: m.agente, resumo: m.conteudo?.substring(0, 80) }));

      return dados;
    }

    function renderizarDiagnostico(d, modoTeste) {
      const corSaude = { verde: 'emerald', amarelo: 'amber', vermelho: 'rose' };
      const cor = corSaude[d.saude_geral] || 'zinc';
      const emojiSaude = { verde: 'ðŸŸ¢', amarelo: 'ðŸŸ¡', vermelho: 'ðŸ”´' };

      const chaves = d.diagnostico_presente?.chaves_api || {};
      const chavesHtml = Object.entries(chaves).map(([k, v]) =>
        `<span class="${v ? 'text-emerald-400' : 'text-red-400'} text-xs font-mono">${v ? 'âœ“' : 'âœ—'} ${k}</span>`
      ).join(' Â· ');

      const alertas = (d.alertas_criticos || []).map(a =>
        `<div class="flex gap-2 text-xs text-rose-300"><span class="shrink-0">ðŸš¨</span>${a}</div>`
      ).join('');

      const futuro = (d.previsao_futuro || []).map(f => {
        const probCor = { alta: 'rose', media: 'amber', baixa: 'zinc' };
        return `<div class="bg-${probCor[f.probabilidade]||'zinc'}-900/20 border border-${probCor[f.probabilidade]||'zinc'}-800/30 rounded-lg p-3">
          <div class="flex justify-between items-start mb-1">
            <span class="text-xs font-semibold text-white">${f.evento}</span>
            <span class="text-[10px] font-bold text-${probCor[f.probabilidade]||'zinc'}-400 uppercase ml-2 shrink-0">${f.probabilidade} Â· ${f.prazo}</span>
          </div>
          <p class="text-[11px] text-zinc-400">â†’ ${f.prevencao}</p>
        </div>`;
      }).join('');

      const frente = (d.frente_para_tras || []).map(f =>
        `<div class="border-l-2 border-violet-700/50 pl-3 py-1">
          <p class="text-xs font-semibold text-violet-300">ðŸ‘¤ ${f.acao_usuario}</p>
          <p class="text-[11px] text-zinc-400 mt-0.5">âš™ï¸ ${f.fluxo_interno}</p>
          ${f.ponto_critico ? `<p class="text-[11px] text-amber-400 mt-0.5">âš ï¸ ${f.ponto_critico}</p>` : ''}
        </div>`
      ).join('');

      const acoes = (d.proximas_acoes_recomendadas || []).slice(0, 5).map((a, i) =>
        `<div class="flex gap-3 items-start">
          <span class="text-xs font-bold text-zinc-500 shrink-0 w-5">${i+1}.</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-zinc-200">${a.acao}</p>
            <p class="text-[10px] text-zinc-500 mt-0.5">${a.responsavel} Â· ${a.tempo_estimado}</p>
          </div>
        </div>`
      ).join('');

      document.getElementById('vidente-body').innerHTML = `
        <div class="space-y-5 p-6">
          ${modoTeste ? '<div class="bg-amber-900/30 border border-amber-700/50 rounded-xl px-4 py-2 text-xs text-amber-300 font-bold text-center">âš ï¸ MODO TESTE â€” Dados simulados de falha</div>' : ''}

          <!-- Score geral -->
          <div class="bg-${cor}-900/20 border border-${cor}-800/30 rounded-2xl p-4 flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-${cor}-900/40 border-2 border-${cor}-700 flex items-center justify-center shrink-0">
              <span class="text-2xl font-black text-${cor}-300">${d.score_sistema}</span>
            </div>
            <div>
              <p class="font-bold text-white text-base">${emojiSaude[d.saude_geral]} Sistema ${d.saude_geral === 'verde' ? 'SaudÃ¡vel' : d.saude_geral === 'amarelo' ? 'AtenÃ§Ã£o' : 'CrÃ­tico'}</p>
              <p class="text-xs text-zinc-400 mt-1">${chavesHtml}</p>
            </div>
          </div>

          <!-- Alertas -->
          ${alertas ? `<div class="space-y-2">${alertas}</div>` : ''}

          <!-- Estado presente -->
          <div>
            <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Estado Atual</p>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <p class="text-zinc-500 mb-1">Backend</p>
                <p class="font-semibold ${d.diagnostico_presente?.backend?.status==='online'?'text-emerald-400':'text-rose-400'}">${d.diagnostico_presente?.backend?.status || '?'} Â· ${d.diagnostico_presente?.backend?.latencia_ms || 0}ms</p>
              </div>
              <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <p class="text-zinc-500 mb-1">Supabase</p>
                <p class="font-semibold ${d.diagnostico_presente?.supabase?.status==='conectado'?'text-emerald-400':'text-rose-400'}">${d.diagnostico_presente?.supabase?.status || '?'}</p>
              </div>
              <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <p class="text-zinc-500 mb-1">Agentes</p>
                <p class="font-semibold text-white">${d.diagnostico_presente?.agentes?.total || agentes.length} ativos</p>
              </div>
              <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <p class="text-zinc-500 mb-1">MemÃ³rias</p>
                <p class="font-semibold text-white">${d.diagnostico_presente?.memorias_squad || _memorias.length} registros</p>
              </div>
            </div>
          </div>

          <!-- Futuro -->
          ${futuro ? `<div><p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">PrevisÃµes</p><div class="space-y-2">${futuro}</div></div>` : ''}

          <!-- Frente â†’ TrÃ¡s -->
          ${frente ? `<div><p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Frente â†’ TrÃ¡s (fluxo do usuÃ¡rio)</p><div class="space-y-2">${frente}</div></div>` : ''}

          <!-- PrÃ³ximas aÃ§Ãµes -->
          ${acoes ? `<div><p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">PrÃ³ximas AÃ§Ãµes</p><div class="space-y-2">${acoes}</div></div>` : ''}

          <!-- Briefing para Claude -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Briefing para Claude Code</p>
              <button onclick="copiarBriefingClaude()"
                class="text-[11px] px-3 py-1 rounded-lg bg-violet-900/50 border border-violet-700/40 text-violet-300 hover:bg-violet-800 transition font-bold">
                ðŸ“‹ Copiar para Claude Code
              </button>
            </div>
            <pre class="bg-black border border-zinc-800 rounded-xl p-4 text-[11px] text-zinc-300 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap max-h-48">${escapar(d.briefing_para_claude || '')}</pre>
          </div>

          <!-- Modo teste -->
          <button onclick="fecharVidente(); rodarVidente(true)"
            class="w-full py-2 rounded-xl bg-amber-900/30 border border-amber-800/40 text-amber-300 text-xs font-bold hover:bg-amber-900/50 transition">
            âš—ï¸ Rodar Modo Teste (simular falhas)
          </button>
        </div>`;
    }

    function copiarBriefingClaude() {
      if (!_ultimoDiagnostico?.briefing_para_claude) return;
      const texto = `# Briefing do Sistema QG IA â€” ${new Date().toLocaleString('pt-BR')}

${_ultimoDiagnostico.briefing_para_claude}

---
Score do sistema: ${_ultimoDiagnostico.score_sistema}/100 Â· SaÃºde: ${_ultimoDiagnostico.saude_geral}
Gerado pelo Agente Vidente`;
      navigator.clipboard.writeText(texto).then(() => mostrarToast('ðŸ“‹ Briefing copiado! Cole no Claude Code.'));
    }

    function abrirModalVidente() {
      const el = document.getElementById('modal-vidente');
      if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
    }
    function fecharVidente() {
      const el = document.getElementById('modal-vidente');
      if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
    }

    // Auto-roda o Vidente ao carregar (versÃ£o leve â€” sÃ³ coleta dados, nÃ£o chama IA)
    async function videnteAutoCheck() {
      const dados = await coletarDadosSistema(() => {}, false);
      // Atualiza badge visual do botÃ£o
      const btn = document.getElementById('btn-vidente');
      if (!btn) return;
      const offline = dados.backend?.status !== 'online';
      const semChaves = !Object.values(dados.chaves_configuradas).some(v => v);
      if (offline || semChaves) {
        btn.classList.add('border-amber-700/60', 'text-amber-400');
        btn.classList.remove('text-zinc-400');
        btn.title = offline ? 'Backend offline' : 'Sem chaves de API';
      }
    }


