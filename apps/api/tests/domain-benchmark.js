const path = require("node:path");
const fs = require("node:fs");
const DomainBenchmarkService = require("../src/services/domainBenchmarkService");
const RoutingService = require("../src/services/routingService");

function main() {
  const taskTypeMapping = RoutingService.routingConfig?.taskTypeMapping || {};
  const result = DomainBenchmarkService.run(undefined, taskTypeMapping);
  const outPath = path.join(
    __dirname,
    "..",
    "universal-engineering-implementation",
    "domain-detection",
    "benchmark-result.json"
  );

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
  console.log(`Benchmark accuracy: ${(result.accuracy * 100).toFixed(1)}% (${result.correct}/${result.total})`);
  console.log(`Saved: ${outPath}`);
}

main();
