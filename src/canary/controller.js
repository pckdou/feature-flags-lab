const fs = require("fs");
const path = require("path");
const cfg = require("../../config/canary.json");
const { collectMetrics, evaluate } = require("./healthcheck");

const LOG_FILE = path.join(__dirname, "../../logs/canary-log.jsonl");
const STATE_FILE = path.join(__dirname, "../../config/canary-state.json");

function resetLog() {
  fs.writeFileSync(LOG_FILE, "");
}

function log(record) {
  fs.appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...record }) + "\n");
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ flag: cfg.flag, ...state }, null, 2));
}

// 1% -> 10% -> 50% -> 100% 순서로 승급, 헬스체크 실패 시 즉시 0%로 롤백
function runCanary(scenario) {
  log({ type: "canary_start", scenario, flag: cfg.flag, stages: cfg.stages });

  for (const stage of cfg.stages) {
    log({ type: "stage_start", scenario, stage });
    writeState({ percentage: stage, status: "in_progress", scenario });

    for (let round = 1; round <= cfg.checksPerStage; round++) {
      const metrics = collectMetrics(cfg, scenario, stage, round);
      const verdict = evaluate(metrics, cfg.healthThresholds);

      log({
        type: "health_check",
        scenario,
        stage,
        round,
        users: metrics.users,
        requests: metrics.requests,
        errorRate: Number(metrics.errorRate.toFixed(4)),
        p95LatencyMs: metrics.p95LatencyMs,
        healthy: verdict.ok,
        reasons: verdict.reasons,
      });

      if (!verdict.ok) {
        log({ type: "rollback", scenario, failedStage: stage, round, to: 0, reasons: verdict.reasons });
        writeState({
          percentage: 0,
          status: "rolled_back",
          scenario,
          failedStage: stage,
          reasons: verdict.reasons,
        });
        return { scenario, status: "ROLLED_BACK", failedStage: stage, finalPercentage: 0, reasons: verdict.reasons.join("; ") };
      }
    }
    log({ type: "promote", scenario, stage });
  }

  log({ type: "canary_complete", scenario, finalPercentage: 100 });
  writeState({ percentage: 100, status: "completed", scenario });
  return { scenario, status: "COMPLETED", failedStage: "-", finalPercentage: 100, reasons: "-" };
}

module.exports = { runCanary, resetLog };