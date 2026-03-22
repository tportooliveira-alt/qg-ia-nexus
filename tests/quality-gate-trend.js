const fs = require("node:fs");
const path = require("node:path");

const HISTORY_PATH = path.join(
  __dirname,
  "..",
  "universal-engineering-implementation",
  "quality-gate-history.jsonl"
);

const REPORT_PATH = path.join(
  __dirname,
  "..",
  "universal-engineering-implementation",
  "QUALITY_GATE_TREND_REPORT.json"
);

function loadHistory() {
  if (!fs.existsSync(HISTORY_PATH)) return [];
  const lines = fs
    .readFileSync(HISTORY_PATH, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.map((line) => JSON.parse(line));
}

function computeTrend(entries) {
  const passed = entries.filter((e) => e.status === "passed");
  const failed = entries.filter((e) => e.status === "failed");
  const accuracies = passed
    .map((e) => Number(e.benchmarkAccuracy))
    .filter((n) => Number.isFinite(n));

  const avg =
    accuracies.length > 0
      ? Number((accuracies.reduce((a, b) => a + b, 0) / accuracies.length).toFixed(4))
      : null;
  const min = accuracies.length > 0 ? Math.min(...accuracies) : null;
  const max = accuracies.length > 0 ? Math.max(...accuracies) : null;
  const last = entries[entries.length - 1] || null;
  const last5 = entries.slice(-5);

  let stability = "insufficient_data";
  if (last5.length >= 3) {
    const last5Passed = last5.filter((e) => e.status === "passed").length;
    if (last5Passed === last5.length) stability = "stable";
    else if (last5Passed >= Math.ceil(last5.length * 0.6)) stability = "degraded";
    else stability = "unstable";
  }

  const alerts = [];
  if (failed.length > 0) alerts.push("There are failed quality-gate runs in history.");
  if (avg !== null && avg < 0.9) alerts.push("Average benchmark accuracy below 90%.");
  if (last && last.status === "failed") alerts.push("Last run failed.");

  return {
    generatedAt: new Date().toISOString(),
    historyFile: HISTORY_PATH,
    totalRuns: entries.length,
    passedRuns: passed.length,
    failedRuns: failed.length,
    benchmark: {
      average: avg,
      min,
      max
    },
    stability,
    lastRun: last,
    last5Runs: last5,
    alerts
  };
}

function main() {
  const entries = loadHistory();
  const report = computeTrend(entries);
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(`Trend report saved: ${REPORT_PATH}`);
  console.log(`runs=${report.totalRuns} passed=${report.passedRuns} failed=${report.failedRuns}`);
  if (report.benchmark.average !== null) {
    console.log(`benchmark_avg=${(report.benchmark.average * 100).toFixed(2)}%`);
  }
}

main();
