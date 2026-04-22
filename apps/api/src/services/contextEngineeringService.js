/**
 * contextEngineeringService.js  STUB m\u00ednimo
 * Criado para desbloquear nexusService.js. Retorna um pacote b\u00e1sico.
 * TODO: substituir por implementa\u00e7\u00e3o real de engenharia de contexto.
 */

async function gerarPacote(prompt, historico = []) {
  const p = prompt === null || prompt === undefined ? '' : String(prompt);
  const h = Array.isArray(historico) ? historico : [];
  return {
    prompt: p,
    historico: h,
    contexto_resumido: p.slice(0, 500),
    tokens_estimados: Math.ceil(p.length / 4),
    gerado_em: new Date().toISOString(),
    stub: true
  };
}

module.exports = { gerarPacote };
