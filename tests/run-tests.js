const assert = require("node:assert/strict");
const DomainDetectorService = require("../src/services/domainDetectorService");
const RoutingService = require("../src/services/routingService");
const KnowledgeService = require("../src/services/knowledgeService");
const DomainBenchmarkService = require("../src/services/domainBenchmarkService");
const RequestValidationService = require("../src/services/requestValidationService");

async function runAllChecks() {
  const r1 = DomainDetectorService.detectDomain("Criar uma API backend com autenticacao JWT");
  assert.equal(r1.domain, "software");
  assert.ok(r1.confidence >= 0.2);

  const r2 = DomainDetectorService.detectDomain("Projetar um motor e caixa de engrenagens para veiculo");
  assert.equal(r2.domain, "mechanical");

  const r3 = DomainDetectorService.detectDomain("texto ambiguo", "building", { building: "civil" });
  assert.equal(r3.domain, "civil");
  assert.equal(r3.confidence, 1);

  const routing = await RoutingService.getRoutingForTask("texto livre", "building");
  assert.equal(routing.domain, "civil");
  assert.ok(Array.isArray(routing.allProviders));
  assert.ok(routing.allProviders.length > 0);
  assert.equal(routing.detection.method, "taskTypeMapping");
  assert.equal(routing.needsClarification, false);

  await KnowledgeService.loadKnowledgeBase();
  const summary = KnowledgeService.getKnowledgeSummary();
  const required = ["software", "mechanical", "civil", "electrical", "chemical", "product", "integration"];
  for (const domain of required) {
    assert.ok(summary[domain], `missing domain: ${domain}`);
    assert.ok(summary[domain].categories > 0, `domain has no categories: ${domain}`);
  }

  const multi = DomainDetectorService.detectDomain(
    "Integracao multidominio entre software, automacao e estrutura de fabrica"
  );
  assert.equal(multi.domain, "integration");

  const benchmark = DomainBenchmarkService.run(undefined, RoutingService.routingConfig?.taskTypeMapping || {});
  assert.ok(benchmark.accuracy >= 0.9, `benchmark accuracy abaixo do alvo: ${benchmark.accuracy}`);

  const invalidDomainPayload = RequestValidationService.validateDomainDetectPayload({});
  assert.equal(invalidDomainPayload.ok, false);
  const validDomainPayload = RequestValidationService.validateDomainDetectPayload({
    taskDescription: "Projeto de API",
    taskType: "api"
  });
  assert.equal(validDomainPayload.ok, true);

  const vagueRouting = await RoutingService.getRoutingForTask("Preciso de ajuda com um projeto");
  assert.equal(vagueRouting.needsClarification, true);
  assert.ok(Array.isArray(vagueRouting.clarificationQuestions));
  assert.ok(vagueRouting.clarificationQuestions.length >= 1);
}

async function run() {
  await runAllChecks();
  console.log("All tests passed.");
}

if (require.main === module) {
  run().catch((error) => {
    console.error("Tests failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  runAllChecks
};
