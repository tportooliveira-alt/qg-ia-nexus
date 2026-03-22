const fs = require("node:fs");
const path = require("node:path");

const RoutingService = require("../src/services/routingService");
const KnowledgeService = require("../src/services/knowledgeService");
const DomainDetectorService = require("../src/services/domainDetectorService");
const DomainBenchmarkService = require("../src/services/domainBenchmarkService");
const { runAllChecks } = require("./run-tests");

async function evaluateRound(round) {
  let testOk = true;
  try {
    await runAllChecks();
  } catch {
    testOk = false;
  }
  await KnowledgeService.ensureReady();
  const summary = KnowledgeService.getKnowledgeSummary();
  const domains = Object.keys(summary);
  const weakDomains = domains.filter((d) => summary[d].categories < 2);

  const domainCheck = [
    DomainDetectorService.detectDomain("Projeto de edificio com fundacao e concreto"),
    DomainDetectorService.detectDomain("Sistema de automacao com sensor e circuito"),
    DomainDetectorService.detectDomain("Plataforma web com API backend"),
    DomainDetectorService.detectDomain("Veiculo com motor e bateria para IoT")
  ];

  const routingCheck = await RoutingService.getRoutingForTask(
    "Projeto multidominio com integracao entre software, automacao eletrica, fundacao civil e maquina mecanica",
    null
  );

  const criticFindings = [];
  const optimistFindings = [];
  const benchmark = DomainBenchmarkService.run();

  if (!testOk) criticFindings.push("Falha nos testes de regressao.");
  else optimistFindings.push("Suite de testes passou sem regressao.");

  if (weakDomains.length > 0) criticFindings.push(`Dominios com pouca base: ${weakDomains.join(", ")}`);
  else optimistFindings.push("Todos os dominios possuem pelo menos duas categorias de conhecimento.");

  if (routingCheck.domain === "software") {
    criticFindings.push("Roteamento tende ao fallback software em tarefas ambiguas.");
  } else {
    optimistFindings.push(`Roteamento identificou dominio ${routingCheck.domain} para caso ambiguo.`);
  }

  const softwareHits = domainCheck.filter((r) => r.domain === "software").length;
  if (softwareHits > 2) criticFindings.push("Detector pode estar enviesado para software.");
  else optimistFindings.push("Detector mostrou distribuicao razoavel entre dominios.");

  if (benchmark.accuracy < 0.85) {
    criticFindings.push(`Acuracia benchmark abaixo do alvo: ${(benchmark.accuracy * 100).toFixed(1)}%`);
  } else {
    optimistFindings.push(`Acuracia benchmark: ${(benchmark.accuracy * 100).toFixed(1)}%`);
  }

  const score = Math.min(100, Math.max(0, 100 - criticFindings.length * 12 + optimistFindings.length * 5));

  return {
    round,
    score,
    critic: criticFindings,
    optimist: optimistFindings,
    testOk,
    routedDomain: routingCheck.domain,
    benchmarkAccuracy: benchmark.accuracy
  };
}

async function main() {
  const rounds = [];
  for (let i = 1; i <= 10; i++) {
    const result = await evaluateRound(i);
    rounds.push(result);
    process.stdout.write(`Round ${i}: score=${result.score} testOk=${result.testOk} domain=${result.routedDomain}\n`);
  }

  const avg = Math.round(rounds.reduce((acc, r) => acc + r.score, 0) / rounds.length);
  const output = {
    generatedAt: new Date().toISOString(),
    averageScore: avg,
    rounds
  };

  const outPath = path.join(__dirname, "..", "universal-engineering-implementation", "WAR_ROOM_LOOP_REPORT.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
  process.stdout.write(`Report saved at ${outPath}\n`);
}

main().catch((err) => {
  console.error("war-room loop failed:", err.message);
  process.exitCode = 1;
});
