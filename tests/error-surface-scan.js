const fs = require("node:fs");
const path = require("node:path");

const RequestValidationService = require("../src/services/requestValidationService");
const RoutingService = require("../src/services/routingService");
const DomainDetectorService = require("../src/services/domainDetectorService");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(len) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !@#$%^&*()_+-=[]{};:',.<>/?`~";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[randomInt(0, chars.length - 1)];
  return out;
}

async function run() {
  const report = {
    generatedAt: new Date().toISOString(),
    domainPayloadFuzz: {},
    knowledgeQueryFuzz: {},
    routingFuzz: {},
    detectorRobustness: {}
  };

  // 1) Payload fuzz para /api/domain-detect
  let totalDomainPayload = 0;
  let accepted = 0;
  let rejected = 0;
  let unexpected = 0;
  for (let i = 0; i < 1200; i++) {
    totalDomainPayload++;
    const withDesc = Math.random() > 0.35;
    const withType = Math.random() > 0.65;
    const payload = {
      taskDescription: withDesc ? randomString(randomInt(0, 7000)) : "",
      taskType: withType ? randomString(randomInt(0, 180)) : ""
    };
    const result = RequestValidationService.validateDomainDetectPayload(payload);
    if (result.ok) accepted++;
    else rejected++;
    if (result.ok && !result.sanitized.taskDescription && !result.sanitized.taskType) unexpected++;
  }
  report.domainPayloadFuzz = {
    total: totalDomainPayload,
    accepted,
    rejected,
    unexpectedEmptyAccepted: unexpected
  };

  // 2) Query fuzz para /api/knowledge
  let totalKnowledgeQuery = 0;
  let clampViolations = 0;
  for (let i = 0; i < 1200; i++) {
    totalKnowledgeQuery++;
    const query = {
      category: randomString(randomInt(0, 260)),
      search: randomString(randomInt(0, 620)),
      maxResults: randomString(randomInt(0, 6))
    };
    const result = RequestValidationService.validateKnowledgeQuery(query);
    if (result.ok) {
      if (result.sanitized.maxResults < 1 || result.sanitized.maxResults > 200) {
        clampViolations++;
      }
    }
  }
  report.knowledgeQueryFuzz = {
    total: totalKnowledgeQuery,
    clampViolations
  };

  // 3) Fuzz do routing para entradas vagas/ruidosas
  let totalRouting = 0;
  let clarificationTrue = 0;
  let exceptions = 0;
  for (let i = 0; i < 1000; i++) {
    totalRouting++;
    const text = randomString(randomInt(0, 120));
    try {
      const routing = await RoutingService.getRoutingForTask(text, null);
      if (routing.needsClarification) clarificationTrue++;
    } catch {
      exceptions++;
    }
  }
  report.routingFuzz = {
    total: totalRouting,
    clarificationTrue,
    clarificationRate: Number((clarificationTrue / totalRouting).toFixed(3)),
    exceptions
  };

  // 4) Robustez do detector contra entradas agressivas
  let detectorTotal = 0;
  let detectorExceptions = 0;
  for (let i = 0; i < 2000; i++) {
    detectorTotal++;
    const text = `${randomString(randomInt(0, 80))}\u0000\u0001\u0002${randomString(randomInt(0, 80))}`;
    try {
      DomainDetectorService.detectDomain(text);
    } catch {
      detectorExceptions++;
    }
  }
  report.detectorRobustness = {
    total: detectorTotal,
    exceptions: detectorExceptions
  };

  const outPath = path.join(
    __dirname,
    "..",
    "universal-engineering-implementation",
    "API_ERROR_SURFACE_REPORT.json"
  );
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Saved: ${outPath}`);
}

run().catch((error) => {
  console.error("error-surface-scan failed:", error.message);
  process.exitCode = 1;
});
