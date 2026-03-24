async function salvarTokenVolume() {
  const volume = document.getElementById('token-volume-select').value;
  const qgToken = document.getElementById('qg-token-input').value.trim();
  if (qgToken) localStorage.setItem('io_qg_token', qgToken);
  try {
    const resp = await apiFetch(`${API_URL}/config/token-volume`, {
      method: 'POST',
      body: JSON.stringify({ volume })
    });
    if (!resp.ok) throw new Error('Falha ao aplicar volume');
    mostrarToast(`Volume aplicado: ${volume}`);
  } catch (e) {
    mostrarToast('Erro ao aplicar volume', 'erro');
  }
}

function aplicarDensidade(valor) {
  const v = valor || 'normal';
  document.body.setAttribute('data-density', v);
  localStorage.setItem('io_density', v);
}

(function initDensity(){
  const v = localStorage.getItem('io_density') || 'normal';
  const sel = document.getElementById('density-select');
  if (sel) sel.value = v;
  document.body.setAttribute('data-density', v);
})();
