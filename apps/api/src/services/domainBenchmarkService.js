const fs = require("fs");
const path = require("path");
const DomainDetectorService = require("./domainDetectorService");

class DomainBenchmarkService {
  getDefaultDatasetPath() {
    return path.join(
      __dirname,
      "..",
      "..",
      "universal-engineering-implementation",
      "domain-detection",
      "benchmark-dataset.json"
    );
  }

  loadDataset(datasetPath = this.getDefaultDatasetPath()) {
    const raw = fs.readFileSync(datasetPath, "utf8").replace(/^\uFEFF/, "");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error("benchmark dataset invalido: esperado array");
    }
    return data;
  }

  run(datasetPath = this.getDefaultDatasetPath(), taskTypeMapping = {}) {
    const data = this.loadDataset(datasetPath);
    let correct = 0;
    const byDomain = {};
    const mistakes = [];
    const labels = ["software", "mechanical", "civil", "electrical", "chemical", "product", "integration"];
    const confusionMatrix = {};
    for (const label of labels) {
      confusionMatrix[label] = {};
      for (const predicted of labels) {
        confusionMatrix[label][predicted] = 0;
      }
    }

    for (const item of data) {
      const expected = item.expectedDomain;
      const result = DomainDetectorService.detectDomain(
        item.taskDescription || "",
        item.taskType || null,
        taskTypeMapping
      );
      const hit = result.domain === expected;
      if (hit) correct += 1;
      if (!confusionMatrix[expected]) confusionMatrix[expected] = {};
      confusionMatrix[expected][result.domain] = (confusionMatrix[expected][result.domain] || 0) + 1;

      if (!byDomain[expected]) byDomain[expected] = { total: 0, correct: 0 };
      byDomain[expected].total += 1;
      if (hit) byDomain[expected].correct += 1;

      if (!hit) {
        mistakes.push({
          id: item.id,
          expected,
          predicted: result.domain,
          confidence: result.confidence
        });
      }
    }

    const total = data.length;
    const accuracy = total > 0 ? correct / total : 0;
    const domainAccuracy = {};
    const precisionRecallF1 = {};
    for (const [domain, stats] of Object.entries(byDomain)) {
      domainAccuracy[domain] = stats.total > 0 ? Number((stats.correct / stats.total).toFixed(3)) : 0;
      const tp = confusionMatrix[domain]?.[domain] || 0;
      let fp = 0;
      let fn = 0;
      for (const d of labels) {
        if (d !== domain) {
          fp += confusionMatrix[d]?.[domain] || 0;
          fn += confusionMatrix[domain]?.[d] || 0;
        }
      }
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
      precisionRecallF1[domain] = {
        precision: Number(precision.toFixed(3)),
        recall: Number(recall.toFixed(3)),
        f1: Number(f1.toFixed(3))
      };
    }

    return {
      total,
      correct,
      accuracy: Number(accuracy.toFixed(3)),
      domainAccuracy,
      precisionRecallF1,
      confusionMatrix,
      mistakes
    };
  }
}

module.exports = new DomainBenchmarkService();
