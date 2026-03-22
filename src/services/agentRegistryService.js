const fs = require("fs").promises;
const path = require("path");

const AGENT_DOMAIN_HINTS = {
  DomainDetector: ["integration", "software", "mechanical", "civil", "electrical", "chemical", "product"],
  MechanicalEngineer: ["mechanical"],
  CivilArchitect: ["civil"],
  ElectricalEngineer: ["electrical"],
  ChemicalEngineer: ["chemical"],
  ProductDesigner: ["product"],
  SystemsIntegrator: ["integration"],
  SoftwareEngineer: ["software"],
  Arquiteto: ["software", "integration"],
  Analista: ["software", "integration"],
  Tester: ["software"],
  Coder: ["software"]
};

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inferDomains(agentName, fallback = ["software"]) {
  return AGENT_DOMAIN_HINTS[agentName] || fallback;
}

function inferTaskTypes(domains) {
  const mapping = {
    software: ["web-app", "api", "mobile", "system", "database", "frontend", "backend", "fullstack"],
    mechanical: ["machine", "vehicle", "tool", "robot", "manufacturing", "cad", "materials"],
    civil: ["building", "structure", "foundation", "infrastructure", "urban", "construction"],
    electrical: ["circuit", "power", "automation", "embedded", "iot", "controls"],
    chemical: ["process", "materials", "reaction", "safety", "environment", "industrial"],
    product: ["ux", "ui", "industrial-design", "ergonomics", "usability", "interface"],
    integration: ["multidomain", "system-integration", "complex-project", "orchestration"]
  };

  const all = new Set();
  for (const domain of domains) {
    for (const taskType of mapping[domain] || []) {
      all.add(taskType);
    }
  }
  return Array.from(all);
}

function inferPreferredProviders(domains) {
  const mapping = {
    software: ["Gemini", "DeepSeek", "Anthropic", "Groq"],
    mechanical: ["DeepSeek", "Gemini", "Anthropic"],
    civil: ["Gemini", "Anthropic", "DeepSeek"],
    electrical: ["DeepSeek", "Gemini", "Anthropic"],
    chemical: ["DeepSeek", "Anthropic", "Gemini"],
    product: ["Gemini", "Anthropic", "DeepSeek"],
    integration: ["Anthropic", "Gemini", "DeepSeek"]
  };

  const all = new Set();
  for (const domain of domains) {
    for (const provider of mapping[domain] || []) {
      all.add(provider);
    }
  }
  return Array.from(all);
}

function enrichAgent(agent) {
  const domains = Array.isArray(agent.dominios) && agent.dominios.length > 0
    ? agent.dominios
    : inferDomains(agent.nome);

  const taskType = Array.isArray(agent.taskType) && agent.taskType.length > 0
    ? agent.taskType
    : inferTaskTypes(domains);

  const preferredProviders = Array.isArray(agent.preferredProviders) && agent.preferredProviders.length > 0
    ? agent.preferredProviders
    : inferPreferredProviders(domains);

  const inputSchema = agent.inputSchema || {
    type: "object",
    required: ["prompt"],
    properties: {
      prompt: { type: "string", description: "Descricao da tarefa para o agente" },
      contexto: { type: "string", description: "Contexto opcional" },
      taskType: { type: "string", description: "Tipo da tarefa" }
    }
  };

  return {
    ...agent,
    dominios: domains,
    taskType,
    preferredProviders,
    inputSchema
  };
}

const AgentRegistryService = {
  async listarAgentes() {
    const dir = path.join(__dirname, "../skills/agentes");
    const files = await fs.readdir(dir).catch(() => []);
    const agentes = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const full = path.join(dir, file);
      const raw = await fs.readFile(full, "utf-8").catch(() => null);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        agentes.push(enrichAgent(parsed));
      } catch {
        agentes.push({ nome: file.replace(".json", ""), erro: "JSON invalido" });
      }
    }

    return agentes;
  },

  async listarAgentesPorDominio(dominio) {
    const dominioNormalizado = normalize(dominio);
    const todosAgentes = await this.listarAgentes();
    return todosAgentes.filter((agente) => {
      if (!Array.isArray(agente.dominios)) return false;
      return agente.dominios.some((d) => normalize(d) === dominioNormalizado);
    });
  },

  async obterAgentePorNome(nome) {
    const agentes = await this.listarAgentes();
    return agentes.find((agente) => agente.nome === nome);
  }
};

module.exports = AgentRegistryService;
