async function carregarPendencias() {
  const lista = document.getElementById('governanca-lista');
  lista.innerHTML = '<p class="text-zinc-500">Carregando...</p>';
  try {
    const resp = await apiFetch(`${API_URL}/approvals/pending`);
    if (!resp.ok) throw new Error('Falha ao buscar pendencias');
    const data = await resp.json();
    const itens = data.approvals || [];
    if (!itens.length) {
      lista.innerHTML = '<p class="text-zinc-500">Nenhuma pendência.</p>';
      return;
    }
    lista.innerHTML = itens.map(p => `
      <div class="border border-zinc-800 rounded-xl p-3 bg-black/40">
        <div class="flex items-center justify-between">
          <div class="text-xs text-zinc-500">${p.id}</div>
          <div class="text-xs px-2 py-0.5 rounded-full bg-zinc-800">${p.status}</div>
        </div>
        <div class="mt-2 text-sm font-semibold">${p.acao}</div>
        <div class="text-xs text-zinc-500">Agente: ${p.agente || '-'}</div>
        <div class="text-xs text-zinc-500">Origem: ${p.origem || '-'}</div>
        <div class="mt-2 flex gap-2">
          <button onclick="decidirPendencia('${p.id}','APROVADO')" class="text-xs px-3 py-1.5 rounded-lg bg-emerald-700/70 hover:bg-emerald-600 text-white">Aprovar</button>
          <button onclick="decidirPendencia('${p.id}','NEGADO')" class="text-xs px-3 py-1.5 rounded-lg bg-rose-700/70 hover:bg-rose-600 text-white">Negar</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    lista.innerHTML = `<p class="text-rose-400">Erro: ${e.message}</p>`;
  }
}

async function decidirPendencia(id, status) {
  try {
    const resp = await apiFetch(`${API_URL}/approvals/decide`, {
      method: 'POST',
      body: JSON.stringify({ id, status, decisor: 'Priscila (Web)' })
    });
    if (!resp.ok) throw new Error('Falha ao decidir');
    mostrarToast(`Pendência ${status.toLowerCase()}`);
    carregarPendencias();
  } catch (e) {
    mostrarToast('Erro ao decidir', 'erro');
  }
}

function abrirGovernanca() {
  document.getElementById('modal-governanca').classList.remove('hidden');
  document.getElementById('modal-governanca').classList.add('flex');
  carregarPendencias();
}

function fecharGovernanca() {
  document.getElementById('modal-governanca').classList.add('hidden');
  document.getElementById('modal-governanca').classList.remove('flex');
}
