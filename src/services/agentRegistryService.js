const fs = require("fs").promises;
const path = require("path");

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
        agentes.push(JSON.parse(raw));
      } catch {
        agentes.push({ nome: file.replace(".json", ""), erro: "JSON invalido" });
      }
    }
    return agentes;
  }
};

module.exports = AgentRegistryService;
