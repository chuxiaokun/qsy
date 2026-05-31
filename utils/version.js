// 本文件由 scripts/gen-version.js 自动生成，请勿手改
// 生成时间：2026-05-31T10:58:49.644Z
// 三仓：xiaoe@330e36d(7) api@90a9013(2) admin@f545d8b(2)

const APP_VERSION = "1.2.0"
const BUILD_NUMBER = 11
const RELEASE_DATE = "2026-05-31"

const REPOS = {
  xiaoe: { commits: 7, hash: "330e36d" },
  api: { commits: 2, hash: "90a9013" },
  admin: { commits: 2, hash: "f545d8b" }
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
