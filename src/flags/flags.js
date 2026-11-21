const fs = require("fs");
const path = require("path");
const { inRollout } = require("./rollout");

const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../config/rollout.json"), "utf8")
);

function getEnv() {
  return process.env.APP_ENV || "development";
}

// 우선순위: 환경 변수 강제 설정 > 대상 사용자 > 대상 그룹 > 환경별 퍼센트
function isEnabled(flagName, user = {}) {
  const flag = config.flags[flagName];
  if (!flag || !flag.enabled) return false;

  // 1) 환경 변수 강제 설정: FLAG_NEW_CHECKOUT=on / off
  const override = process.env[`FLAG_${flagName.toUpperCase()}`];
  if (override === "on") return true;
  if (override === "off") return false;

  // 2) 대상 사용자 / 그룹
  if ((flag.allowUsers || []).includes(user.id)) return true;
  if ((flag.allowGroups || []).includes(user.group)) return true;

  // 3) 환경별 퍼센트 롤아웃
  const percentage = flag.environments?.[getEnv()] ?? 0;
  return inRollout(user.id, flagName, percentage);
}

module.exports = { isEnabled, getEnv, config };