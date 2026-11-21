const crypto = require("crypto");

// 사용자 ID + salt를 해시해 0~99 버킷에 배정 (같은 입력이면 항상 같은 버킷)
function bucket(userId, salt) {
  const hash = crypto.createHash("sha256").update(`${salt}:${userId}`).digest("hex");
  return parseInt(hash.slice(0, 8), 16) % 100;
}

function inRollout(userId, salt, percentage) {
  return bucket(userId, salt) < percentage;
}

module.exports = { bucket, inRollout };