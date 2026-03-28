/**
 * 🏭 FABRICA IA PLUGIN — Integração Nexus ↔ Fábrica de IA API
 *
 * Conecta o QG IA Nexus à Fábrica de IA (fabrica-ia-api) via HTTP/SSE.
 * O Nexus faz chamadas servidor→servidor usando X-Chave-Fabrica.
 * A chave nunca é exposta ao browser do usuário.
 */

const https = require('https');
const http = require('http');

const FABRICA_URL = (process.env.FABRICA_API_URL || 'https://fabrica-ia-api.onrender.com').replace(/\/$/, '');
const FABRICA_KEY = process.env.FABRICA_API_KEY || '';

/**
 * Faz uma requisição HTTP/HTTPS para a Fábrica de IA.
 * @param {string} path - Caminho da rota (ex: '/api/status')
 * @param {string} method - Método HTTP (GET, POST)
 * @param {object|null} body - Corpo da requisição (apenas para POST)
 * @returns {Promise<object>} - JSON de resposta
 */
function requisitar(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(FABRICA_URL + path);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Chave-Fabrica': FABRICA_KEY,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      },
      timeout: 30000
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout ao conectar na Fábrica de IA'));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

const FabricaPlugin = {
  nome: 'fabricaIA',
  versao: '1.0.0',
  descricao: 'Integração com a Fábrica de IA — pipeline multi-agente para geração de apps',
  ativo: true, // pode ser desligado pelo operador via /api/fabrica/toggle

  /**
   * Verifica se a Fábrica está online.
   */
  async statusFabrica() {
    return requisitar('/api/status');
  },

  /**
   * Inicia o pipeline v4 (MasterOrchestrator) com uma ideia.
   * @param {string} ideia - Texto descrevendo o app desejado
   * @returns {Promise<{pipelineId: string, ...}>}
   */
  async submeterIdeia(ideia) {
    if (!ideia || typeof ideia !== 'string' || ideia.trim().length < 5) {
      throw new Error('Ideia muito curta. Descreva o app com pelo menos 5 caracteres.');
    }
    return requisitar('/api/pipeline/iniciar', 'POST', { ideia: ideia.trim() });
  },

  /**
   * Consulta o status de um pipeline específico.
   * @param {string} pipelineId
   */
  async statusPipeline(pipelineId) {
    if (!pipelineId) throw new Error('pipelineId obrigatório');
    const todos = await requisitar('/api/pipeline/status');
    const pipelines = todos.pipelines || todos.ativos || [];
    const encontrado = pipelines.find(p => p.id === pipelineId || p.pipelineId === pipelineId);
    return encontrado || { id: pipelineId, status: 'não encontrado ou concluído' };
  },

  /**
   * Conecta ao stream SSE de um pipeline e repassa eventos via callbacks.
   * Usado pelo proxy SSE no server.js.
   *
   * @param {string} pipelineId
   * @param {function} onData - Chamado a cada evento SSE recebido (string raw)
   * @param {function} onEnd  - Chamado quando o stream terminar
   * @param {function} onError - Chamado em caso de erro
   * @returns {object} req - A requisição HTTP (para poder abortar)
   */
  abrirStream(pipelineId, onData, onEnd, onError) {
    if (!pipelineId) { onError(new Error('pipelineId obrigatório')); return null; }

    const parsed = new URL(FABRICA_URL + `/api/pipeline/${encodeURIComponent(pipelineId)}/stream`);
    const isHttps = parsed.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Chave-Fabrica': FABRICA_KEY
      }
    };

    const req = lib.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', onData);
      res.on('end', onEnd);
      res.on('error', onError);
    });

    req.on('error', onError);
    req.end();
    return req;
  },

  /**
   * Lista os projetos gerados pela Fábrica.
   */
  async listarProjetos() {
    return requisitar('/api/fabrica/projetos');
  },

  /**
   * Busca um projeto específico pelo ID.
   * @param {string} id
   */
  async buscarProjeto(id) {
    if (!id) throw new Error('id obrigatório');
    return requisitar(`/api/fabrica/projetos/${encodeURIComponent(id)}`);
  },

  /**
   * Cancela um pipeline em execução.
   * @param {string} pipelineId
   */
  async cancelarPipeline(pipelineId) {
    if (!pipelineId) throw new Error('pipelineId obrigatório');
    return requisitar(`/api/pipeline/${encodeURIComponent(pipelineId)}/cancelar`, 'POST');
  }
};

module.exports = FabricaPlugin;
