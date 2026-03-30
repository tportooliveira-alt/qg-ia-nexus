const fs = require("fs").promises;
const path = require("path");
const MemoryService = require("./memoryService");
const MysqlService = require("./mysqlService");

const EVOLUTION_FILE = path.join(__dirname, "../logs/learned_facts.json");

/**
 * Gera hash simples de uma string para deduplicação
 */
function simpleHash(str) {
  let h = 0;
  const s = String(str || "").substring(0, 200).toLowerCase().replace(/\s+/g, " ");
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

const EvolutionService = {
  async registrarAprendizado(categoria, fato, fonte) {
    try {
      let facts = [];
      const content = await fs.readFile(EVOLUTION_FILE, "utf-8").catch(() => "[]");
      facts = JSON.parse(content);

      // ── Deduplicação: não salvar se já existe conteúdo similar ──
      const hash = simpleHash(fato);
      const catNorm = String(categoria || "").toLowerCase().trim();
      const duplicado = facts.some(f => {
        const fCat = String(f.categoria || "").toLowerCase().trim();
        const fHash = simpleHash(f.fato);
        return fCat === catNorm && fHash === hash;
      });

      if (duplicado) {
        console.log(`[EVOLUÇÃO] ⚠️ Conhecimento duplicado ignorado: ${categoria}`);
        return false;
      }

      // ── Limite: manter apenas os últimos 200 fatos ──
      if (facts.length >= 200) {
        facts = facts.slice(-150);
      }

      const novoFato = {
        data: new Date().toISOString(),
        categoria,
        fato,
        fonte,
        hash,
        impacto: "Analizado pelo Nexus Claw"
      };

      facts.push(novoFato);
      await fs.writeFile(EVOLUTION_FILE, JSON.stringify(facts, null, 2), "utf-8");
      console.log(`[EVOLUÇÃO] ✅ Novo conhecimento: ${categoria} (total: ${facts.length})`);

      // Espelha no MySQL (memória persistente)
      try {
        await MemoryService.registrar({
          agente: "NexusClaw",
          categoria,
          conteudo: fato,
          projeto: "QG-IA"
        });
        // Também salva na tabela de aprendizados (com hash para dedup)
        if (MysqlService.ativo()) {
          await MysqlService.inserir("agent_learnings", {
            categoria,
            conteudo: fato,
            fonte: fonte || "sistema",
            hash_conteudo: hash,
          });
        }
      } catch (e) {
        console.warn("[EVOLUCAO] Persistencia MySQL falhou:", e.message);
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
  },

  /**
   * Remove duplicatas existentes do arquivo de fatos
   */
  async limparDuplicatas() {
    const content = await fs.readFile(EVOLUTION_FILE, "utf-8").catch(() => "[]");
    const facts = JSON.parse(content);
    const seen = new Set();
    const uniques = [];

    for (const f of facts) {
      const key = `${String(f.categoria || "").toLowerCase()}:${simpleHash(f.fato)}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniques.push(f);
      }
    }

    if (uniques.length < facts.length) {
      await fs.writeFile(EVOLUTION_FILE, JSON.stringify(uniques, null, 2), "utf-8");
      console.log(`[EVOLUÇÃO] 🧹 Limpeza: ${facts.length} → ${uniques.length} fatos (removidas ${facts.length - uniques.length} duplicatas)`);
    }

    return { antes: facts.length, depois: uniques.length, removidas: facts.length - uniques.length };
  }
};

module.exports = EvolutionService;
