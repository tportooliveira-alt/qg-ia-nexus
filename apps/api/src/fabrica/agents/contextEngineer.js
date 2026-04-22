/**
 * contextEngineer.js  STUB passthrough
 * Criado como stub m\u00ednimo para desbloquear o pipeline da F\u00e1brica de IA.
 * TODO: substituir por implementa\u00e7\u00e3o real que refine o contexto via LLM.
 */

async function refinarContexto(ideia) {
  if (ideia === null || ideia === undefined) return '';
  const texto = String(ideia).trim();
  console.log('[contextEngineer:STUB] refinarContexto recebeu ' + texto.length + ' chars (passthrough)');
  return texto;
}

module.exports = { refinarContexto };
