const { CLOUD_ENV } = require("./config")

const STORAGE_USER = "mp_user"
const STORAGE_TOKEN = "mp_token"
const STORAGE_PUBLIC_ID = "mp_public_id"

function cloudReady() {
  return !!(wx.cloud && CLOUD_ENV)
}

function callCloud(name, data = {}) {
  return new Promise((resolve, reject) => {
    if (!cloudReady()) {
      reject(new Error("云开发未初始化"))
      return
    }
    wx.cloud
      .callFunction({ name, data })
      .then((res) => resolve(res.result || {}))
      .catch(reject)
  })
}

function getToken() {
  return wx.getStorageSync(STORAGE_TOKEN) || ""
}

function getUser() {
  return wx.getStorageSync(STORAGE_USER) || null
}

function saveSession(token, user) {
  if (token) wx.setStorageSync(STORAGE_TOKEN, token)
  if (user) wx.setStorageSync(STORAGE_USER, user)
}

function createLocalGuest() {
  let publicId = wx.getStorageSync(STORAGE_PUBLIC_ID)
  if (!publicId) {
    publicId = 10000 + Math.floor(Math.random() * 89999)
    wx.setStorageSync(STORAGE_PUBLIC_ID, publicId)
  }
  const suffix = Math.random().toString(36).slice(2, 6)
  return {
    id: `local_${publicId}`,
    publicId,
    nickname: `游客_${suffix}`,
    email: "",
    emailVerified: false,
    isGuest: true,
    isLocal: true
  }
}

function ensureLocalGuest() {
  let user = getUser()
  if (user && user.isLocal) return user
  user = createLocalGuest()
  saveSession(`local_${user.id}`, user)
  return user
}

function normalizeUser(raw) {
  if (!raw) return null
  return {
    id: raw.id || raw.userId || raw._id || "",
    publicId: raw.publicId || raw.public_id || raw.displayId || 0,
    nickname: raw.nickname || raw.nick_name || "用户",
    avatarUrl: raw.avatarUrl || raw.avatar_url || "",
    email: raw.email || "",
    emailVerified: !!(raw.emailVerified || raw.email_verified),
    isGuest: raw.isGuest === true || raw.is_guest === true,
    isLocal: false
  }
}

async function loginWithCloud() {
  const body = await callCloud("login")
  if (body.code === 200 && body.data) {
    const { token, user } = body.data
    const normalized = normalizeUser(user)
    saveSession(token, normalized)
    return normalized
  }
  throw new Error(body.msg || "登录失败")
}

/**
 * 启动时云函数静默登录（openid）；失败则本地游客
 */
async function ensureLogin() {
  if (!cloudReady()) {
    const cached = getUser()
    if (cached) return cached
    return ensureLocalGuest()
  }
  try {
    return await loginWithCloud()
  } catch {
    const cached = getUser()
    if (cached && !cached.isLocal) return cached
    if (cached && cached.isLocal) return cached
    return ensureLocalGuest()
  }
}

function getDisplayId(user) {
  if (!user) return "——"
  const id = user.publicId || user.public_id
  return id ? String(id) : "——"
}

function getAvatarInitial(user) {
  const name = (user && user.nickname) || "游"
  return name.slice(0, 1).toUpperCase()
}

function isEmailBound(user) {
  return !!(user && user.email && user.emailVerified)
}

async function sendEmailCode(email) {
  const body = await callCloud("sendEmailCode", { email })
  if (body.code === 200) return body
  throw new Error(body.msg || "发送失败")
}

async function bindEmail(email, code) {
  const body = await callCloud("bindEmail", { email, code })
  if (body.code === 200 && body.data) {
    const user = normalizeUser(body.data.user || body.data) || {
      ...getUser(),
      email,
      emailVerified: true,
      isGuest: false
    }
    user.email = email
    user.emailVerified = true
    saveSession(getToken(), user)
    return user
  }
  throw new Error(body.msg || "绑定失败")
}

function refreshUserFromStorage() {
  return getUser()
}

module.exports = {
  ensureLogin,
  getUser,
  getToken,
  getDisplayId,
  getAvatarInitial,
  isEmailBound,
  sendEmailCode,
  bindEmail,
  refreshUserFromStorage,
  saveSession,
  ensureLocalGuest,
  callCloud
}
