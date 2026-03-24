const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { runAllChecks } = require("./run-tests");
const { runErrorPathScan } = require("./error-path-scan");
const { runFuzzScan } = require("./fuzz-domain-detector");
const DomainBenchmarkService = require("../src/services/domainBenchmarkService");
const RoutingService = require("../src/services/routingService");

async function runQualityGate() {
  // Repeticao para reduzir chance de falso positivo de estabilidade.
  for (let i = 0; i < 5; i++) {
    await runAllChecks();
  }

  const benchmark = DomainBenchmarkService.run(undefined, RoutingService.routingConfig?.taskTypeMapping || {});
  assert.ok(benchmark.accuracy >= 0.9, `Benchmark abaixo do alvo: ${benchmark.accuracy}`);

  const { report: errorScan } = await runErrorPathScan();
  assert.equal(errorScan.mismatches, 0, `Mismatches no error scan: ${errorScan.mismatches}`);
  assert.equal(errorScan.validationFindings.length, 0, `Falhas de validacao encontradas: ${errorScan.validationFindings.join("; ")}`);
  assert.ok(errorScan.lowConfidenceMatches <= 4, `Low confidence acima do tolerado: ${errorScan.lowConfidenceMatches}`);

  const { report: fuzz } = runFuzzScan();
  const byMutation = fuzz.byMutation || {};

  // remove-vowels e um caos extremo; acompanhamos mas nao bloqueamos duro.
  assert.ok((byMutation["drop-char"]?.mismatchRate || 1) <= 0.25, "Fuzz drop-char acima do limite");
  assert.ok((byMutation["noise"]?.mismatchRate || 1) <= 0.1, "Fuzz noise acima do limite");
  assert.ok((byMutation["trim-half"]?.mismatchRate || 1) <= 0.1, "Fuzz trim-half acima do limite");
  assert.ok((byMutation["mixed-case"]?.mismatchRate || 1) <= 0.1, "Fuzz mixed-case acima do limite");

  return {
    benchmarkAccuracy: benchmark.accuracy,
    errorScan,
    fuzz: byMutation
  };
}

function appendHistory(entry) {
  const historyPath = path.join(
    __dirname,
    "..",
    "universal-engineering-implementation",
    "quality-gate-history.jsonl"
  );
  fs.appendFileSync(historyPath, JSON.stringify(entry) + "\n", "utf8");
  return historyPath;
}

if (require.main === module) {
  runQualityGate()
    .then((result) => {
      const historyEntry = {
        timestamp: new Date().toISOString(),
        status: "passed",
        benchmarkAccuracy: result.benchmarkAccuracy,
        errorScan: {
          mismatches: result.errorScan.mismatches,
          lowConfidenceMatches: result.errorScan.lowConfidenceMatches,
          validationFindings: result.errorScan.validationFindings.length
        },
        fuzz: result.fuzz
      };
      const historyPath = appendHistory(historyEntry);
      console.log("QUALITY GATE PASSED");
      console.log(`benchmark=${(result.benchmarkAccuracy * 100).toFixed(1)}%`);
      console.log(`history=${historyPath}`);
    })
    .catch((error) => {
      try {
        const historyEntry = {
          timestamp: new Date().toISOString(),
          status: "failed",
          error: error.message
        };
        appendHistory(historyEntry);
      } catch {
        // nao interrompe retorno do erro principal
      }
      console.error("QUALITY GATE FAILED:", error.message);
      process.exitCode = 1;
    });
}

module.exports = {
  runQualityGate
};
