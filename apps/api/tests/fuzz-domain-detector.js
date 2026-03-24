const fs = require("node:fs");
const path = require("node:path");

const DomainDetectorService = require("../src/services/domainDetectorService");
const RoutingService = require("../src/services/routingService");

function removeVowels(text) {
  return text.replace(/[aeiou]/gi, "");
}

function dropRandomChar(text) {
  if (!text || text.length < 8) return text;
  const idx = Math.floor(text.length / 3);
  return text.slice(0, idx) + text.slice(idx + 1);
}

function duplicateNoise(text) {
  return `### ${text} ### ${text.split(" ").slice(0, 4).join(" ")} ...`;
}

function trimToHalf(text) {
  return text.slice(0, Math.max(1, Math.floor(text.length / 2)));
}

function mixedCase(text) {
  return text
    .split("")
    .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
    .join("");
}

function mutate(text, kind) {
  switch (kind) {
    case "remove-vowels":
      return removeVowels(text);
    case "drop-char":
      return dropRandomChar(text);
    case "noise":
      return duplicateNoise(text);
    case "trim-half":
      return trimToHalf(text);
    case "mixed-case":
      return mixedCase(text);
    default:
      return text;
  }
}

function loadDataset() {
  const p = path.join(
    __dirname,
    "..",
    "universal-engineering-implementation",
    "domain-detection",
    "benchmark-dataset.json"
  );
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
}

function runFuzzScan() {
  const dataset = loadDataset();
  const mapping = RoutingService.routingConfig?.taskTypeMapping || {};
  const mutationKinds = ["remove-vowels", "drop-char", "noise", "trim-half", "mixed-case"];
  const report = {
    generatedAt: new Date().toISOString(),
    totalOriginal: dataset.length,
    totalMutated: dataset.length * mutationKinds.length,
    byMutation: {},
    highRiskSamples: []
  };

  for (const kind of mutationKinds) {
    let total = 0;
    let mismatch = 0;
    let lowConfidence = 0;
    for (const row of dataset) {
      total += 1;
      const mutated = mutate(row.taskDescription, kind);
      const result = DomainDetectorService.detectDomain(mutated, row.taskType || null, mapping);
      if (result.domain !== row.expectedDomain) {
        mismatch += 1;
        if (report.highRiskSamples.length < 80) {
          report.highRiskSamples.push({
            mutation: kind,
            id: row.id,
            expected: row.expectedDomain,
            predicted: result.domain,
            confidence: result.confidence
          });
        }
      } else if (result.confidence < 0.35) {
        lowConfidence += 1;
      }
    }
    report.byMutation[kind] = {
      total,
      mismatch,
      mismatchRate: Number((mismatch / total).toFixed(3)),
      lowConfidence,
      lowConfidenceRate: Number((lowConfidence / total).toFixed(3))
    };
  }

  const outPath = path.join(
    __dirname,
    "..",
    "universal-engineering-implementation",
    "FUZZ_PATH_REPORT.json"
  );
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  return { report, outPath };
}

if (require.main === module) {
  const { outPath } = runFuzzScan();
  console.log(`Fuzz completed. Saved: ${outPath}`);
}

module.exports = {
  runFuzzScan
};
