const { inRollout } = require("../flags/rollout");

// 시드 기반 난수 (같은 시드면 항상 같은 결과 -> 재현 가능)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

// 현재 카나리 비율에 포함된 사용자들의 요청 지표를 시뮬레이션
function collectMetrics(cfg, scenarioName, percentage, round) {
  const sc = cfg.scenarios[scenarioName];
  const rand = mulberry32(cfg.seed + percentage * 1000 + round);

  const faulty = sc.faultFromStage != null && percentage >= sc.faultFromStage;
  const errorProb = faulty && sc.faultError != null ? sc.faultError : sc.baseError;
  const baseLat = faulty && sc.faultLatency != null ? sc.faultLatency : sc.baseLatency;

  let users = 0, requests = 0, errors = 0;
  const latencies = [];

  for (let i = 1; i <= cfg.population; i++) {
    const userId = `user-${String(i).padStart(4, "0")}`;
    if (!inRollout(userId, `canary:${cfg.flag}`, percentage)) continue;
    users++;
    for (let r = 0; r < cfg.requestsPerUser; r++) {
      requests++;
      if (rand() < errorProb) errors++;
      let lat = baseLat * (0.7 + rand() * 0.6);
      if (rand() < 0.05) lat *= 1.5; // 일부 꼬리 지연
      latencies.push(Math.round(lat));
    }
  }

  return {
    users,
    requests,
    errors,
    errorRate: requests ? errors / requests : 0,
    p95LatencyMs: requests ? percentile(latencies, 95) : 0,
  };
}

// 임계값과 비교해서 건강 여부 판정
function evaluate(metrics, th) {
  const reasons = [];
  if (metrics.requests < th.minSamples) {
    reasons.push(`샘플 부족 (${metrics.requests} < ${th.minSamples})`);
  }
  if (metrics.errorRate > th.maxErrorRate) {
    reasons.push(
      `에러율 초과 (${(metrics.errorRate * 100).toFixed(1)}% > ${(th.maxErrorRate * 100).toFixed(1)}%)`
    );
  }
  if (metrics.p95LatencyMs > th.maxP95LatencyMs) {
    reasons.push(`p95 지연 초과 (${metrics.p95LatencyMs}ms > ${th.maxP95LatencyMs}ms)`);
  }
  return { ok: reasons.length === 0, reasons };
}

module.exports = { collectMetrics, evaluate };