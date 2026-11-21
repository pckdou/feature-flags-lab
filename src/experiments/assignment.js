const { bucket } = require("../flags/rollout");
const { config } = require("../flags/flags");

// 실험명 + 사용자 ID 해시 기반 할당 -> 같은 사용자는 항상 같은 variant
function getVariant(experimentName, userId) {
  const exp = config.experiments[experimentName];
  if (!exp) throw new Error(`Unknown experiment: ${experimentName}`);

  const b = bucket(userId, experimentName);
  let cumulative = 0;
  for (const [variant, weight] of Object.entries(exp.variants)) {
    cumulative += weight;
    if (b < cumulative) return variant;
  }
  return Object.keys(exp.variants)[0];
}

module.exports = { getVariant };