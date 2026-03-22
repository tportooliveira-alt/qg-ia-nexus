const path = require("path");

// ============================================
// 🛡️ MIDDLEWARE DE SEGURANÇA — QG IA
// ============================================

/**
 * Middleware de Autenticação Dupla.
 * Aceita autenticação por DOIS métodos (qualquer um serve):
 *
 *   1) Header "X-QG-Token: <QG_AUTH_TOKEN>" — usado pelo frontend
 *   2) Header "Authorization: Bearer <QG_AUTH_TOKEN>" — usado por chamadas externas/API
 *
 * Adicione no .env:  QG_AUTH_TOKEN=seu_token_secreto_aqui
 */
function autenticarToken(req, res, next) {
  const tokenValido = process.env.QG_AUTH_TOKEN;

  if (!tokenValido) {
    console.error("[SEGURANÇA] QG_AUTH_TOKEN não definido no .env! Todas as rotas protegidas estão BLOQUEADAS.");
    return res.status(500).json({
      error: "Servidor mal configurado. Token de autenticação não definido no ambiente."
    });
  }

  // Método 1: Header customizado X-QG-Token (usado pelo frontend)
  const qgToken = req.headers["x-qg-token"];
  if (qgToken && qgToken === tokenValido) {
    return next();
  }

  // Método 2: Header Authorization Bearer (usado por chamadas externas)
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.split(" ")[1];
    if (bearerToken === tokenValido) {
      return next();
    }
  }

  // Método 3: Query param ?token= (necessário para EventSource/SSE — browser não envia headers)
  const queryToken = req.query.token;
  if (queryToken && queryToken === tokenValido) {
    return next();
  }

  // Nenhum método passou
  return res.status(403).json({
    error: "Acesso negado. Token de autenticação inválido ou ausente.",
    dica: "Envie o header X-QG-Token, Authorization: Bearer <TOKEN>, ou ?token=<TOKEN>"
  });
}

/**
 * Middleware de Validação de Path.
 * Impede Directory Traversal (../../etc/passwd) nas rotas de arquivo.
 * Restringe acesso somente a pastas permitidas.
 */
function validarPath(pastasPermitidas = []) {
  return (req, res, next) => {
    // Pega o path do query (GET) ou body (POST)
    const filePath = req.query.path || req.body.path;

    if (!filePath) {
      return res.status(400).json({ error: "Parâmetro 'path' é obrigatório." });
    }

    // Resolve o path absoluto pra eliminar ../ e truques
    const pathResolvido = path.resolve(filePath);

    // Verifica se o path resolvido está dentro de alguma pasta permitida
    const dentroDePermitida = pastasPermitidas.some(pasta => {
      const pastaResolvida = path.resolve(pasta);
      return pathResolvido.startsWith(pastaResolvida + path.sep) || pathResolvido === pastaResolvida;
    });

    if (!dentroDePermitida) {
      console.warn(`[SEGURANÇA] Tentativa de acesso bloqueada: ${filePath} → resolvido: ${pathResolvido}`);
      return res.status(403).json({
        error: "Acesso negado. Caminho fora das pastas permitidas.",
        pastasPermitidas: pastasPermitidas
      });
    }

    // Salva o path seguro no request pra usar na rota
    req.pathSeguro = pathResolvido;
    next();
  };
}

/**
 * Middleware de Rate Limiting simples (por IP).
 * Limita a X requisições por minuto por IP nas rotas sensíveis.
 */
const contadorIP = new Map();

function rateLimiter(maxPorMinuto = 30) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const agora = Date.now();
    const janela = 60 * 1000; // 1 minuto

    if (!contadorIP.has(ip)) {
      contadorIP.set(ip, []);
    }

    const requisicoes = contadorIP.get(ip).filter(t => agora - t < janela);
    requisicoes.push(agora);
    contadorIP.set(ip, requisicoes);

    if (requisicoes.length > maxPorMinuto) {
      return res.status(429).json({
        error: "Limite de requisições excedido. Aguarde 1 minuto.",
        limite: maxPorMinuto
      });
    }

    next();
  };
}

// Limpa o mapa de IPs a cada 5 minutos pra não crescer infinito
setInterval(() => {
  const agora = Date.now();
  for (const [ip, tempos] of contadorIP) {
    const validos = tempos.filter(t => agora - t < 60000);
    if (validos.length === 0) contadorIP.delete(ip);
    else contadorIP.set(ip, validos);
  }
}, 5 * 60 * 1000);

module.exports = { autenticarToken, validarPath, rateLimiter };
