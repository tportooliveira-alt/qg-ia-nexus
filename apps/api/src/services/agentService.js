const path = require("path");
const AIService = require("./aiService");

const NEXUS_ROOT = path.resolve(__dirname, "../..");

// Verifica se o Anthropic Agent SDK pode ser usado
function temAnthropicKey() {
  return !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 10);
}

/**
 * Executa um agente autônomo.
 * - Com ANTHROPIC_API_KEY: usa Claude Agent SDK (ferramentas reais: Read, Glob, Grep, WebSearch)
 * - Sem chave: usa cascata de IAs (Gemini/Groq/Cerebras) como fallback
 *
 * @param {string} tarefa - Descrição da tarefa
 * @param {object} opcoes
 * @returns {AsyncGenerator} - Gera eventos: { tipo, conteudo }
 */
async function* executarAgente(tarefa, opcoes = {}) {
  if (temAnthropicKey()) {
    // Modo autônomo completo com Claude Agent SDK
    try {
      const { query } = require("@anthropic-ai/claude-agent-sdk");
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

      yield { tipo: "inicio", conteudo: "Agente Autônomo iniciado (Claude Agent SDK)" };

      for await (const msg of query(params)) {
        const tipo = msg.type;
        if (tipo === "assistant") {
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
        } else if (tipo === "system" && msg.subtype === "init") {
          yield { tipo: "inicio", conteudo: `Agente iniciado | modelo: ${msg.model}` };
        }
      }
      return;
    } catch (err) {
      console.warn("[AGENT] Claude Agent SDK falhou, usando fallback cascata:", err.message);
    }
  }

  // Fallback: cascata de IAs sem ferramentas externas
  yield { tipo: "inicio", conteudo: "Agente iniciado via cascata de IAs (Gemini/Groq/Cerebras)" };

  try {
    const promptCompleto =
      "Você é um agente autônomo de análise e execução de tarefas. " +
      "Responda em português, seja detalhado e estruturado.\n\n" +
      "TAREFA:\n" + tarefa;

    let fullText = "";
    yield { tipo: "ferramenta", conteudo: "[CascataIA] Iniciando processamento..." };

    await AIService.callGeminiStream(promptCompleto, null, (chunk) => {
      fullText += chunk;
      // não yield durante stream para evitar muitos eventos
    }).catch(async () => {
      await AIService.callGroqStream(promptCompleto, null, (chunk) => { fullText += chunk; })
        .catch(async () => {
          await AIService.callCerebrasStream(promptCompleto, null, (chunk) => { fullText += chunk; })
            .catch(async () => {
              const r = await AIService.callDeepSeek(promptCompleto, null);
              fullText = r;
            });
        });
    });

    yield { tipo: "texto", conteudo: fullText };
    yield { tipo: "resultado", conteudo: fullText, subtype: "success", custo: null };
  } catch (err) {
    yield { tipo: "erro", conteudo: `Todas as IAs falharam: ${err.message}` };
  }
}

/**
 * Executa o agente e retorna o resultado final como string.
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
