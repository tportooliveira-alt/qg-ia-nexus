const ResearchService = require("./src/services/researchService");
const dotenv = require("dotenv");

// Carrega as chaves
dotenv.config();

async function iniciarEvolucao() {
  console.log("--------------------------------------------------");
  console.log("🚀 INICIANDO CICLO DE EVOLUÇÃO AUTÔNOMA DO NEXUS");
  console.log("O Nexus Claw ficará estudando por 1 hora...");
  console.log("--------------------------------------------------");

  try {
    await ResearchService.cicloDeEstudoIntensivo();
    console.log("✅ Ciclo de aprendizado finalizado.");
    console.log("Verifique 'src/logs/learned_facts.json' para ver o que eu aprendi.");
  } catch (err) {
    console.error("❌ Falha no ciclo de evolução:", err.message);
  }
}

iniciarEvolucao();