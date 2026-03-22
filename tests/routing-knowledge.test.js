const test = require("node:test");
const assert = require("node:assert/strict");

const RoutingService = require("../src/services/routingService");
const KnowledgeService = require("../src/services/knowledgeService");

test("routes by taskType mapping", async () => {
  const routing = await RoutingService.getRoutingForTask("texto livre", "building");
  assert.equal(routing.domain, "civil");
  assert.ok(Array.isArray(routing.allProviders));
  assert.ok(routing.allProviders.length > 0);
  assert.equal(routing.detection.method, "taskTypeMapping");
});

test("all engineering domains have at least one knowledge category", async () => {
  await KnowledgeService.loadKnowledgeBase();
  const summary = KnowledgeService.getKnowledgeSummary();
  const required = ["software", "mechanical", "civil", "electrical", "chemical", "product", "integration"];

  for (const domain of required) {
    assert.ok(summary[domain], `missing domain: ${domain}`);
    assert.ok(summary[domain].categories > 0, `domain has no categories: ${domain}`);
  }
});
