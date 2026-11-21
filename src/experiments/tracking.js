const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "../../logs/events.jsonl");

function resetLog() {
  fs.writeFileSync(LOG_FILE, "");
}

// 이벤트를 JSON Lines 형식으로 한 줄씩 기록
function trackEvent(eventName, userId, experiment, variant, props = {}) {
  const record = {
    ts: new Date().toISOString(),
    event: eventName, // "exposure" | "conversion"
    userId,
    experiment,
    variant,
    ...props,
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(record) + "\n");
}

module.exports = { trackEvent, resetLog, LOG_FILE };