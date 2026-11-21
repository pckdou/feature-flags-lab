const { isEnabled, getEnv, config } = require("./flags/flags");
const { getVariant } = require("./experiments/assignment");
const { trackEvent, resetLog } = require("./experiments/tracking");

const EXPERIMENT = "checkout_button_color";
const CONVERSION_RATE = { control: 0.10, treatment: 0.14 }; // 시뮬레이션용 가정값

resetLog();

const flagNames = Object.keys(config.flags);
const flagCount = Object.fromEntries(flagNames.map((f) => [f, 0]));
let inconsistent = 0;

for (let i = 1; i <= 1000; i++) {
  const user = {
    id: `user-${String(i).padStart(4, "0")}`,
    group: i % 10 === 0 ? "beta" : i % 7 === 0 ? "employee" : "general",
  };

  // 플래그 평가
  for (const f of flagNames) {
    if (isEnabled(f, user)) flagCount[f]++;
  }

  // A/B 할당 + 일관성 검증 (두 번 호출해도 같아야 함)
  const variant = getVariant(EXPERIMENT, user.id);
  if (variant !== getVariant(EXPERIMENT, user.id)) inconsistent++;

  trackEvent("exposure", user.id, EXPERIMENT, variant);
  if (Math.random() < CONVERSION_RATE[variant]) {
    trackEvent("conversion", user.id, EXPERIMENT, variant);
  }
}

console.log(`환경: ${getEnv()}`);
console.log("플래그 활성 사용자 수 (총 1000명):");
console.table(flagCount);
console.log(`할당 불일치 건수: ${inconsistent} (0이어야 정상)`);