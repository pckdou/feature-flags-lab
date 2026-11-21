const cfg = require("../../config/canary.json");
const { runCanary, resetLog } = require("./controller");

resetLog();

console.log(`Canary 대상 플래그: ${cfg.flag}`);
console.log(`단계: ${cfg.stages.join("% -> ")}%`);
console.log(
  `임계값: 에러율 <= ${cfg.healthThresholds.maxErrorRate * 100}%, p95 <= ${cfg.healthThresholds.maxP95LatencyMs}ms\n`
);

const results = Object.keys(cfg.scenarios).map((name) => runCanary(name));

console.table(results);
console.log("상세 기록: logs/canary-log.jsonl");