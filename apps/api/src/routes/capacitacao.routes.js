const { Router } = require("express");
const { autenticarToken, rateLimiter } = require("../services/authMiddleware");
const AutoCapacitationService = require("../services/autoCapacitationService");
const ActivityService = require("../services/activityService");

const router = Router();

// Listar módulos de capacitação disponíveis
router.get("/capacitacao/modulos", autenticarToken, rateLimiter(30), (req, res) => {
  res.json({
    status: "Sucesso",
    modulos: AutoCapacitationService.listarModulos()
  });
});

// Disparar ciclo de capacitação manualmente
router.post("/capacitacao/ciclo", autenticarToken, rateLimiter(2), async (req, res) => {
  try {
    ActivityService.registrar("capacitacao", {
      status: "trabalhando",
      descricao: "Ciclo de capacitação manual iniciado",
      projeto: "QG IA Nexus"
    });

    // Executa em background para não travar a resposta
    res.json({
      status: "Sucesso",
      message: "Ciclo de capacitação iniciado em background. Acompanhe pelo Dashboard."
    });

    // Executa após responder
    AutoCapacitationService.cicloDeCapacitacao()
      .catch(err => console.error("[CAPACITAÇÃO] Erro no ciclo manual:", err.message))
      .finally(() => ActivityService.finalizar("capacitacao"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disparar auto-avaliação
router.post("/capacitacao/autoavaliacao", autenticarToken, rateLimiter(5), async (req, res) => {
  try {
    const resultado = await AutoCapacitationService.autoAvaliacao();
    res.json({ status: "Sucesso", resultado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
