const test = require("node:test");
const assert = require("node:assert/strict");

const DomainDetectorService = require("../src/services/domainDetectorService");

test("detects software domain from programming terms", () => {
  const result = DomainDetectorService.detectDomain("Criar uma API backend com autenticacao JWT");
  assert.equal(result.domain, "software");
  assert.ok(result.confidence >= 0.2);
});

test("detects mechanical domain from machine terms", () => {
  const result = DomainDetectorService.detectDomain("Projetar um motor e caixa de engrenagens para veiculo");
  assert.equal(result.domain, "mechanical");
});

test("uses taskType mapping with high confidence", () => {
  const mapping = { building: "civil" };
  const result = DomainDetectorService.detectDomain("texto ambiguo", "building", mapping);
  assert.equal(result.domain, "civil");
  assert.equal(result.confidence, 1);
  assert.equal(result.method, "taskTypeMapping");
});
