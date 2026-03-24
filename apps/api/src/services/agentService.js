const { query } = require("@anthropic-ai/claude-agent-sdk");
const path = require("path");

const NEXUS_ROOT = path.resolve(__dirname, "../..");

/**
 * Executa um agente autônomo com o Claude Agent SDK.
 * O agente pode ler arquivos, executar buscas e analisar o projeto.
 *
 * @param {string} tarefa - Descrição da tarefa para o agente
 * @param {object} [opcoes]
 * @param {string[]} [opcoes.ferramentas] - Ferramentas permitidas (padrão: seguras, sem escrita)
 * @param {string} [opcoes.dir] - Diretório de trabalho (padrão: raiz do Nexus)
 * @param {AbortController} [opcoes.abortController]
 * @returns {AsyncGenerator} - Gera eventos: { tipo, conteudo }
 */
async function* executarAgente(tarefa, opcoes = {}) {
  const {
    ferramentas = ["Read", "Glob", "Grep", "WebSearch", "WebFetch"],
    dir = NEXUS_ROOT,
    abortController,
  } = opcoes;

  const params = {
    prompt: tarefa,
    options: {
      allowedTools: ferramentas,
      cwd: dir,
      ...(abortController ? { abortController } : {}),
    },
  };

  for await (const msg of query(params)) {
    const tipo = msg.type;

    if (tipo === "assistant") {
      // Mensagem de texto do agente
      const blocos = msg.message?.content || [];
      for (const bloco of blocos) {
        if (bloco.type === "text" && bloco.text) {
          yield { tipo: "texto", conteudo: bloco.text };
        } else if (bloco.type === "tool_use") {
          yield { tipo: "ferramenta", conteudo: `[${bloco.name}] ${JSON.stringify(bloco.input).substring(0, 120)}` };
        }
      }
    } else if (tipo === "result") {
      yield {
        tipo: "resultado",
        conteudo: msg.result || "",
        subtype: msg.subtype,
        custo: msg.usage ? `${msg.usage.input_tokens} in / ${msg.usage.output_tokens} out tokens` : null,
      };
    } else if (tipo === "system") {
      if (msg.subtype === "init") {
        yield { tipo: "inicio", conteudo: `Agente iniciado | modelo: ${msg.model}` };
      }
    }
  }
}

/**
 * Executa o agente e retorna o resultado final como string.
 * Útil para chamadas simples sem streaming.
 */
async function consultarAgente(tarefa, opcoes = {}) {
  const eventos = [];
  let resultado = "";
  let custo = null;

  for await (const evento of executarAgente(tarefa, opcoes)) {
    eventos.push(evento);
    if (evento.tipo === "resultado") {
      resultado = evento.conteudo;
      custo = evento.custo;
    }
  }

  return { resultado, custo, eventos };
}

module.exports = { executarAgente, consultarAgente };
