// 本文件由 scripts/gen-version.js 自动生成，请勿手改
// 生成时间：2026-06-01T08:21:39.404Z
// 三仓：xiaoe@eb7b916(9) api@—(0) admin@—(0)

const APP_VERSION = "1.2.0"
const BUILD_NUMBER = 9
const RELEASE_DATE = "2026-06-01"

const REPOS = {
  xiaoe: { commits: 9, hash: "eb7b916" },
  api: { commits: 0, hash: "—" },
  admin: { commits: 0, hash: "—" }
}

/** 个人中心展示：版本 1.2.0 */
function getVersionLabel() {
  return `版本 ${APP_VERSION}`
}

/** 含构建号（可选调试）：版本 1.2.0 · build 11 */
function getVersionDetail() {
  return `版本 ${APP_VERSION} · build ${BUILD_NUMBER}`
}

module.exports = {
  APP_VERSION,
  BUILD_NUMBER,
  RELEASE_DATE,
  REPOS,
  getVersionLabel,
  getVersionDetail
}
