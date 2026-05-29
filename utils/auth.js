const { API_BASE } = require("./config")

const STORAGE_USER = "mp_user"
const STORAGE_TOKEN = "mp_token"
const STORAGE_PUBLIC_ID = "mp_public_id"

function request({ url, method = "GET", data, needAuth = false }) {
  const header = { "Content-Type": "application/json" }
  if (needAuth) {
    const token = wx.getStorageSync(STORAGE_TOKEN)
    if (token) header.Authorization = `Bearer ${token}`
  }
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }
        reject(new Error(`HTTP ${res.statusCode}`))
      },
      fail: reject
    })
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

function wxLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => (res.code ? resolve(res.code) : reject(new Error("no code"))),
      fail: reject
    })
  })
}

function normalizeUser(raw) {
  if (!raw) return null
  return {
    id: raw.id || raw.userId || "",
    publicId: raw.publicId || raw.public_id || raw.displayId || 0,
    nickname: raw.nickname || raw.nick_name || "游客",
    email: raw.email || "",
    emailVerified: !!(raw.emailVerified || raw.email_verified),
    isGuest: raw.isGuest !== false && raw.is_guest !== false,
    isLocal: false
  }
}

async function loginWithCode(code) {
  const body = await request({
    url: `${API_BASE}/api/mp/login`,
    method: "POST",
    data: { code }
  })
  if (body.code === 200 && body.data) {
    const { token, user } = body.data
    const normalized = normalizeUser(user)
    saveSession(token, normalized)
    return normalized
  }
  throw new Error(body.msg || "login failed")
}

/**
 * 启动时静默登录：每次尝试后端 openid；失败则沿用/创建本地游客
 */
async function ensureLogin() {
  try {
    const code = await wxLoginCode()
    return await loginWithCode(code)
  } catch {
    const cached = getUser()
    if (cached) return cached
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
  const body = await request({
    url: `${API_BASE}/api/mp/auth/send-email-code`,
    method: "POST",
    data: { email },
    needAuth: true
  })
  if (body.code === 200) return body
  throw new Error(body.msg || "发送失败")
}

async function bindEmail(email, code) {
  const body = await request({
    url: `${API_BASE}/api/mp/auth/bind-email`,
    method: "POST",
    data: { email, code },
    needAuth: true
  })
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
  ensureLocalGuest
}
