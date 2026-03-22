const fs = require("node:fs");
const path = require("node:path");

const DomainDetectorService = require("../src/services/domainDetectorService");
const RequestValidationService = require("../src/services/requestValidationService");
const KnowledgeService = require("../src/services/knowledgeService");
const RoutingService = require("../src/services/routingService");

function typo(word) {
  if (!word || word.length < 4) return word;
  const idx = Math.floor(word.length / 2);
  return word.slice(0, idx) + word.slice(idx + 1);
}

function buildAdversarialCases() {
  const seeds = [
    { domain: "software", text: "Criar API backend frontend mobile com autenticacao e logs" },
    { domain: "mechanical", text: "Projeto mecanico com engrenagens, transmissao, torque e usinagem CNC" },
    { domain: "civil", text: "Obra civil com fundacoes, concreto, estrutura e infraestrutura urbana" },
    { domain: "electrical", text: "Sistema eletrico com circuito de potencia, firmware embarcado e sensores" },
    { domain: "chemical", text: "Processo quimico com reacao, reator, balanceamento de massa e energia" },
    { domain: "product", text: "Design de produto com UX, UI, usabilidade e prototipo navegavel" },
    { domain: "integration", text: "Integracao multidominio entre software, mecanica, civil e eletrica" }
  ];

  const cases = [];
  for (const seed of seeds) {
    cases.push({ type: "baseline", expected: seed.domain, text: seed.text });
    cases.push({ type: "uppercase", expected: seed.domain, text: seed.text.toUpperCase() });
    cases.push({ type: "accentless", expected: seed.domain, text: seed.text.normalize("NFD").replace(/[\u0300-\u036f]/g, "") });
    cases.push({ type: "typo", expected: seed.domain, text: typo(seed.text) });
    cases.push({ type: "noise-prefix", expected: seed.domain, text: `@@@@@@ ${seed.text}` });
    cases.push({ type: "noise-suffix", expected: seed.domain, text: `${seed.text} #######` });
  }

  cases.push({
    type: "ambiguous-no-integration-keyword",
    expected: "integration",
    text: "Projeto com software, automacao eletrica, fundacoes civis e maquina mecanica em unico fluxo"
  });
  cases.push({
    type: "short-empty",
    expected: "software",
    text: ""
  });
  cases.push({
    type: "generic-low-signal",
    expected: "software",
    text: "Preciso de ajuda com meu projeto"
  });
  cases.push({
    type: "typo-heavy-electrical",
    expected: "electrical",
    text: "sistema eletrco com circtio, potnca, sensres e firmare embarcdo"
  });
  cases.push({
    type: "typo-heavy-chemical",
    expected: "chemical",
    text: "procsso qumico com reatr, catalsador, massa e energia"
  });

  return cases;
}

async function runErrorPathScan() {
  const errors = [];
  const lowConfidence = [];
  const cases = buildAdversarialCases();

  for (const c of cases) {
    const r = DomainDetectorService.detectDomain(c.text);
    if (r.domain !== c.expected) {
      errors.push({
        caseType: c.type,
        expected: c.expected,
        predicted: r.domain,
        confidence: r.confidence,
        text: c.text
      });
    } else if (r.confidence < 0.35) {
      lowConfidence.push({
        caseType: c.type,
        domain: r.domain,
        confidence: r.confidence,
        text: c.text
      });
    }
  }

  // Validation edge cases
  const validationFindings = [];
  const longInput = "x".repeat(7000);
  const v1 = RequestValidationService.validateDomainDetectPayload({ taskDescription: longInput });
  if (v1.ok) validationFindings.push("Domain detect aceita taskDescription > 5000");

  const v2 = RequestValidationService.validateKnowledgeQuery({ maxResults: "9999", search: "x" });
  if (!v2.ok || v2.sanitized.maxResults !== 200) {
    validationFindings.push("Knowledge query nao faz clamp correto de maxResults");
  }

  // Knowledge readiness and routing edge
  await KnowledgeService.ensureReady();
  const summary = KnowledgeService.getKnowledgeSummary();
  const emptyDomains = Object.entries(summary)
    .filter(([, s]) => s.categories === 0)
    .map(([d]) => d);

  const route = await RoutingService.getRoutingForTask("texto genericissimo sem sinal");

  const report = {
    generatedAt: new Date().toISOString(),
    totalCases: cases.length,
    mismatches: errors.length,
    lowConfidenceMatches: lowConfidence.length,
    mismatchSamples: errors.slice(0, 40),
    lowConfidenceSamples: lowConfidence.slice(0, 40),
    validationFindings,
    emptyKnowledgeDomains: emptyDomains,
    genericRoutingDomain: route.domain,
    genericRoutingConfidence: route.detection?.confidence ?? null
  };

  const outPath = path.join(
    __dirname,
    "..",
    "universal-engineering-implementation",
    "ERROR_PATH_SCAN_REPORT.json"
  );
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  return { report, outPath };
}

if (require.main === module) {
  runErrorPathScan()
    .then(({ report, outPath }) => {
      console.log(`Error path scan done. mismatches=${report.mismatches}, lowConfidence=${report.lowConfidenceMatches}`);
      console.log(`Saved: ${outPath}`);
    })
    .catch((e) => {
      console.error("error-path-scan failed:", e.message);
      process.exitCode = 1;
    });
}

module.exports = {
  runErrorPathScan
};
