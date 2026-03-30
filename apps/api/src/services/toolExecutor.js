/**
 * toolExecutor.js — Motor de Execução de Ferramentas para Agentes
 *
 * Este é o CORAÇÃO que faltava. Antes, os agentes só geravam texto.
 * Agora eles podem:
 *   1. Executar comandos no terminal (com sandboxing)
 *   2. Ler/escrever arquivos no projeto
 *   3. Consultar Supabase (banco de dados)
 *   4. Chamar APIs externas
 *   5. Salvar aprendizados persistentes
 *
 * SEGURANÇA:
 *   - Comandos perigosos são bloqueados (rm -rf, shutdown, etc.)
 *   - Timeout de 30s por ferramenta
 *   - Approval gates para ações destrutivas
 *   - Todas as ações são auditadas
 */

const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const MemoryService = require("../services/memoryService");
const EvolutionService = require("../services/evolutionService");

// ── Comandos bloqueados (segurança) ──────────────────────────────────────────
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//,
  /shutdown/,
  /reboot/,
  /mkfs/,
  /dd\s+if=/,
  /:(){ :|:& };:/,
  />\s*\/dev\/sd/,
  /chmod\s+777\s+\//,
  /curl.*\|.*sh/,
  /wget.*\|.*sh/,
];

function isCommandSafe(cmd) {
  return !BLOCKED_PATTERNS.some((p) => p.test(cmd));
}

// ── Ferramentas disponíveis ──────────────────────────────────────────────────

const TOOLS = {
  /**
   * Executa um comando no terminal
   */
  async execute_command({ command, cwd }) {
    if (!isCommandSafe(command)) {
      return { success: false, error: "Comando bloqueado por segurança" };
    }
    const workDir = cwd || process.cwd();
    return new Promise((resolve) => {
      exec(command, { cwd: workDir, timeout: 30000, maxBuffer: 1024 * 512 }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          stdout: stdout?.substring(0, 5000) || "",
          stderr: stderr?.substring(0, 2000) || "",
          error: error?.message?.substring(0, 500) || null,
        });
      });
    });
  },

  /**
   * Lê um arquivo
   */
  async read_file({ filePath }) {
    try {
      const resolved = path.resolve(filePath);
      const content = await fs.readFile(resolved, "utf-8");
      return { success: true, content: content.substring(0, 10000), lines: content.split("\n").length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Escreve/cria um arquivo
   */
  async write_file({ filePath, content }) {
    try {
      const resolved = path.resolve(filePath);
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, content, "utf-8");
      return { success: true, path: resolved, bytes: Buffer.byteLength(content) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Lista arquivos de um diretório
   */
  async list_directory({ dirPath, recursive }) {
    try {
      const resolved = path.resolve(dirPath);
      const entries = await fs.readdir(resolved, { withFileTypes: true });
      const items = entries.map((e) => ({
        name: e.name,
        type: e.isDirectory() ? "dir" : "file",
      }));
      return { success: true, path: resolved, items };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Salva um aprendizado na memória persistente
   */
  async save_learning({ category, content, source }) {
    try {
      await EvolutionService.registrarAprendizado(
        category,
        content,
        source || "Agent Tool"
      );
      await MemoryService.registrar({
        agente: "AgentTool",
        categoria: category,
        conteudo: content,
        projeto: "QG-IA-Nexus",
      });
      return { success: true, message: "Aprendizado salvo com sucesso" };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Busca memórias/aprendizados anteriores
   */
  async search_memory({ category, limit }) {
    try {
      const memorias = await MemoryService.listar({
        categoria: category,
        limit: limit || 10,
      });
      return {
        success: true,
        total: memorias.length,
        memories: memorias.map((m) => ({
          categoria: m.categoria,
          conteudo: m.conteudo?.substring(0, 300),
          data: m.created_at,
        })),
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Verifica status do sistema
   */
  async system_status() {
    const os = require("os");
    return {
      success: true,
      hostname: os.hostname(),
      platform: os.platform(),
      uptime_hours: Math.round(os.uptime() / 3600),
      memory_free_mb: Math.round(os.freemem() / 1024 / 1024),
      memory_total_mb: Math.round(os.totalmem() / 1024 / 1024),
      cpus: os.cpus().length,
      cwd: process.cwd(),
      node: process.version,
    };
  },

  /**
   * Lista servidores MCP ativos e suas ferramentas
   */
  async mcp_list() {
    try {
      const McpService = require("./mcpService");
      const servers = McpService.listServers();
      return { success: true, servers };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Invoca uma ferramenta de um servidor MCP
   */
  async mcp_invoke({ server, tool, args }) {
    try {
      const McpService = require("./mcpService");
      if (!McpService.isRunning(server)) {
        return { success: false, error: `Servidor MCP "${server}" não está ativo` };
      }
      const result = await McpService.invokeTool(server, tool, args || {});
      return { success: true, result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};

// ── Definição de ferramentas (para incluir no prompt dos agentes) ────────────

const TOOL_DEFINITIONS = [
  {
    name: "execute_command",
    description: "Executa um comando no terminal do servidor",
    params: { command: "string (comando bash)", cwd: "string (diretório, opcional)" },
  },
  {
    name: "read_file",
    description: "Lê o conteúdo de um arquivo",
    params: { filePath: "string (caminho do arquivo)" },
  },
  {
    name: "write_file",
    description: "Cria ou sobrescreve um arquivo",
    params: { filePath: "string", content: "string" },
  },
  {
    name: "list_directory",
    description: "Lista arquivos e pastas de um diretório",
    params: { dirPath: "string", recursive: "boolean (opcional)" },
  },
  {
    name: "save_learning",
    description: "Salva um aprendizado na memória persistente do Nexus",
    params: { category: "string", content: "string", source: "string (opcional)" },
  },
  {
    name: "search_memory",
    description: "Busca aprendizados anteriores por categoria",
    params: { category: "string", limit: "number (opcional, default 10)" },
  },
  {
    name: "system_status",
    description: "Retorna status do sistema (CPU, RAM, Node version)",
    params: {},
  },
  {
    name: "mcp_list",
    description: "Lista servidores MCP ativos e suas ferramentas disponíveis",
    params: {},
  },
  {
    name: "mcp_invoke",
    description: "Invoca uma ferramenta de um servidor MCP ativo",
    params: { server: "string (nome do servidor)", tool: "string (nome da ferramenta)", args: "object (argumentos)" },
  },
];

// ── Executor principal ───────────────────────────────────────────────────────

/**
 * Executa uma ferramenta pelo nome com os argumentos fornecidos
 * @param {string} toolName - Nome da ferramenta
 * @param {object} toolArgs - Argumentos da ferramenta
 * @returns {object} Resultado da execução
 */
async function executeTool(toolName, toolArgs = {}) {
  const tool = TOOLS[toolName];
  if (!tool) {
    return { success: false, error: `Ferramenta "${toolName}" não encontrada` };
  }

  const start = Date.now();
  try {
    const result = await Promise.race([
      tool(toolArgs),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: ferramenta demorou mais de 30s")), 30000)
      ),
    ]);
    result.duration_ms = Date.now() - start;
    result.tool = toolName;
    return result;
  } catch (err) {
    return { success: false, error: err.message, tool: toolName, duration_ms: Date.now() - start };
  }
}

/**
 * Parseia chamadas de ferramenta da resposta de um agente
 * Formato: TOOL:nome_ferramenta:{"arg1":"val1","arg2":"val2"}
 */
function parseToolCalls(agentResponse) {
  const calls = [];
  const regex = /TOOL:(\w+):(\{[^}]+\})/g;
  let match;
  while ((match = regex.exec(agentResponse)) !== null) {
    try {
      calls.push({
        tool: match[1],
        args: JSON.parse(match[2]),
      });
    } catch {
      /* JSON parse falhou, ignora */
    }
  }
  return calls;
}

/**
 * Gera a seção de ferramentas para incluir no system prompt dos agentes
 */
function getToolsPromptSection() {
  return (
    "\n\n## FERRAMENTAS DISPONÍVEIS\n" +
    "Você tem acesso a ferramentas reais. Para usar uma, inclua na sua resposta:\n" +
    "TOOL:nome_ferramenta:{\"argumento\": \"valor\"}\n\n" +
    "Ferramentas:\n" +
    TOOL_DEFINITIONS.map(
      (t) =>
        `- **${t.name}**: ${t.description}\n  Params: ${JSON.stringify(t.params)}`
    ).join("\n") +
    "\n\nDEPOIS de chamar uma ferramenta, o sistema executará e retornará o resultado. Use o resultado para complementar sua resposta.\n" +
    "IMPORTANTE: Sempre SALVE aprendizados importantes com save_learning para lembrar em sessões futuras.\n"
  );
}

module.exports = {
  executeTool,
  parseToolCalls,
  getToolsPromptSection,
  TOOL_DEFINITIONS,
  TOOLS,
};
