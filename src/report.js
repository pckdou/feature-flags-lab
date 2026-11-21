const fs = require("fs");
const { LOG_FILE } = require("./experiments/tracking");

const events = fs.readFileSync(LOG_FILE, "utf8").trim().split("\n").map(JSON.parse);

const stats = {};
for (const e of events) {
  stats[e.variant] ??= { exposures: 0, conversions: 0 };
  if (e.event === "exposure") stats[e.variant].exposures++;
  if (e.event === "conversion") stats[e.variant].conversions++;
}

for (const v of Object.values(stats)) {
  v.rate = ((v.conversions / v.exposures) * 100).toFixed(1) + "%";
}
console.table(stats);