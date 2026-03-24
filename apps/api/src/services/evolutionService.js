const fs = require("fs").promises;
const path = require("path");
const MemoryService = require("./memoryService");

const EVOLUTION_FILE = path.join(__dirname, "../logs/learned_facts.json");

const EvolutionService = {
  async registrarAprendizado(categoria, fato, fonte) {
    try {
      let facts = [];
      const content = await fs.readFile(EVOLUTION_FILE, "utf-8").catch(() => "[]");
      facts = JSON.parse(content);

      const novoFato = {
        data: new Date().toISOString(),
        categoria,
        fato,
        fonte,
        impacto: "Analizado pelo Nexus Claw"
      };

      facts.push(novoFato);
      await fs.writeFile(EVOLUTION_FILE, JSON.stringify(facts, null, 2), "utf-8");
      console.log(`[EVOLUÇÃO] Novo conhecimento adquirido: ${categoria}`);

      // Espelha no Supabase (memoria persistente) se possivel
      try {
        await MemoryService.registrar({
          agente: "NexusClaw",
          categoria,
          conteudo: fato,
          projeto: "QG-IA"
        });
      } catch (e) {
        console.warn("[EVOLUÇÃO] Supabase memoria falhou:", e.message);
      }
      return true;
    } catch (err) {
      console.error("[EVOLUÇÃO] Erro ao registrar fato:", err);
      return false;
    }
  },

  async listarConhecimentos() {
    const content = await fs.readFile(EVOLUTION_FILE, "utf-8").catch(() => "[]");
    return JSON.parse(content);
  }
};

module.exports = EvolutionService;
