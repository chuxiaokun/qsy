/**
 * 根据三仓 Git 提交记录生成 utils/version.js
 * 用法：node scripts/gen-version.js
 */
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const XIAOE_ROOT = path.join(__dirname, "..")
const API_ROOT = path.join(XIAOE_ROOT, "..", "xiaoe-api")
const ADMIN_ROOT = path.join(XIAOE_ROOT, "..", "kunkit-admin")
const OUT_FILE = path.join(XIAOE_ROOT, "utils", "version.js")

function git(repo, args) {
  try {
    return execSync(`git ${args}`, { cwd: repo, encoding: "utf8" }).trim()
  } catch {
    return ""
  }
}

function repoInfo(root) {
  const name = path.basename(root)
  return {
    name,
    commits: Number(git(root, "rev-list --count HEAD")) || 0,
    hash: git(root, "rev-parse --short HEAD") || "—",
    date: (git(root, "log -1 --format=%cs") || "").slice(0, 10)
  }
}

function resolveSemver(xiaoeRoot, xCommits) {
  const hasVip = fs.existsSync(path.join(xiaoeRoot, "utils", "entitlement.js"))
  const hasHistory = fs.existsSync(path.join(xiaoeRoot, "utils", "history.js"))
  const hasApiAuth = fs.existsSync(path.join(xiaoeRoot, "utils", "auth.js"))

  // 无 tag 时按功能里程碑推断 SemVer（与提交信息对应）
  if (hasVip) return "1.2.0"
  if (xCommits >= 6 && hasApiAuth) return "1.1.0"
  if (xCommits >= 3 && hasHistory) return "1.0.0"
  return "0.9.0"
}

function main() {
  const xiaoe = repoInfo(XIAOE_ROOT)
  const api = repoInfo(API_ROOT)
  const admin = repoInfo(ADMIN_ROOT)
  const semver = resolveSemver(XIAOE_ROOT, xiaoe.commits)
  const build = xiaoe.commits + api.commits + admin.commits
  const releaseDate = [xiaoe.date, api.date, admin.date].filter(Boolean).sort().pop() || ""

  const content = `// 本文件由 scripts/gen-version.js 自动生成，请勿手改
// 生成时间：${new Date().toISOString()}
// 三仓：xiaoe@${xiaoe.hash}(${xiaoe.commits}) api@${api.hash}(${api.commits}) admin@${admin.hash}(${admin.commits})

const APP_VERSION = "${semver}"
const BUILD_NUMBER = ${build}
const RELEASE_DATE = "${releaseDate}"

const REPOS = {
  xiaoe: { commits: ${xiaoe.commits}, hash: "${xiaoe.hash}" },
  api: { commits: ${api.commits}, hash: "${api.hash}" },
  admin: { commits: ${admin.commits}, hash: "${admin.hash}" }
}

/** 个人中心展示：版本 1.2.0 */
function getVersionLabel() {
  return \`版本 \${APP_VERSION}\`
}

/** 含构建号（可选调试）：版本 1.2.0 · build 11 */
function getVersionDetail() {
  return \`版本 \${APP_VERSION} · build \${BUILD_NUMBER}\`
}

module.exports = {
  APP_VERSION,
  BUILD_NUMBER,
  RELEASE_DATE,
  REPOS,
  getVersionLabel,
  getVersionDetail
}
`

  fs.writeFileSync(OUT_FILE, content, "utf8")
  console.log(getVersionLabelFrom(semver))
  console.log(`  build ${build} | ${releaseDate}`)
  console.log(`  -> ${OUT_FILE}`)
}

function getVersionLabelFrom(v) {
  return `版本 ${v}`
}

main()
