const { CLOUD_ENV, API_BASE } = require("./config")

const STORAGE_USER = "mp_user"
const STORAGE_TOKEN = "mp_token"
const STORAGE_PUBLIC_ID = "mp_public_id"
const STORAGE_PROFILE_DISMISS = "mp_profile_dismiss"

function apiReady() {
  return !!(API_BASE && String(API_BASE).trim())
}

function cloudReady() {
  return !!(wx.cloud && CLOUD_ENV)
}

function apiBase() {
  return String(API_BASE).trim().replace(/\/$/, "")
}

function requestApi(path, data = {}, method = "POST", options = {}) {
  return new Promise((resolve, reject) => {
    if (!apiReady()) {
      reject(new Error("未配置 API_BASE"))
      return
    }
    const header = { "content-type": "application/json" }
    const token = options.token !== undefined ? options.token : getToken()
    if (token) header.Authorization = `Bearer ${token}`
    wx.request({
      url: `${apiBase()}${path}`,
      method,
      header,
      data,
      success: (res) => {
        const status = res.statusCode || 0
        const body = res.data || {}
        if (status >= 200 && status < 300) {
          resolve(body)
          return
        }
        reject(new Error(body.msg || `请求失败(${status})`))
      },
      fail: (err) => reject(err.errMsg ? new Error(err.errMsg) : err)
    })
  })
}

function wxLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) resolve(res.code)
        else reject(new Error("微信登录失败"))
      },
      fail: reject
    })
  })
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

function resolveAvatarUrl(url) {
  const raw = (url || "").trim()
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw)) {
    if (apiReady() && apiBase().startsWith("https://") && raw.startsWith("http://")) {
      return `https://${raw.slice(7)}`
    }
    return raw
  }
  if (!apiReady()) return raw
  const rel = raw.startsWith("/") ? raw : `/${raw}`
  return `${apiBase()}${rel}`
}

function normalizeUser(raw) {
  if (!raw) return null
  return {
    id: raw.id || raw.userId || raw._id || "",
    publicId: raw.publicId || raw.public_id || raw.displayId || 0,
    nickname: raw.nickname || raw.nick_name || "用户",
    avatarUrl: resolveAvatarUrl(raw.avatarUrl || raw.avatar_url || ""),
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

async function loginWithApi() {
  const code = await wxLoginCode()
  const body = await requestApi("/api/login", { code })
  if (body.code === 200 && body.data) {
    const { token, user } = body.data
    const normalized = normalizeUser(user)
    saveSession(token, normalized)
    return normalized
  }
  throw new Error(body.msg || "登录失败")
}

/**
 * 启动时静默登录：优先自建 API，否则云函数；失败则本地游客
 */
async function ensureLogin() {
  if (apiReady()) {
    try {
      return await loginWithApi()
    } catch {
      const cached = getUser()
      if (cached && !cached.isLocal) return cached
      if (cached && cached.isLocal) return cached
      return ensureLocalGuest()
    }
  }

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
  if (apiReady()) {
    const body = await requestApi("/api/user/email/send-code", { email })
    if (body.code === 200) return body
    throw new Error(body.msg || "发送失败")
  }
  const body = await callCloud("sendEmailCode", { email })
  if (body.code === 200) return body
  throw new Error(body.msg || "发送失败")
}

async function bindEmail(email, code) {
  if (apiReady()) {
    const body = await requestApi("/api/user/email/bind", { email, code })
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

function needsProfileSetup(user) {
  if (!user || user.isLocal || user.isGuest) return false
  if (!apiReady()) return false
  if (wx.getStorageSync(STORAGE_PROFILE_DISMISS)) return false
  return !user.avatarUrl
}

function dismissProfileSetup() {
  wx.setStorageSync(STORAGE_PROFILE_DISMISS, 1)
}

function clearProfileDismiss() {
  wx.removeStorageSync(STORAGE_PROFILE_DISMISS)
}

/**
 * 上传头像并保存昵称（POST /api/user/profile，multipart）
 */
function saveUserProfile(avatarPath, nickname) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    if (!token) {
      reject(new Error("请先登录"))
      return
    }
    if (!apiReady()) {
      reject(new Error("未配置 API_BASE"))
      return
    }
    const name = (nickname || "").trim()
    if (!name) {
      reject(new Error("请填写昵称"))
      return
    }
    if (!avatarPath) {
      reject(new Error("请选择头像"))
      return
    }

    wx.uploadFile({
      url: `${apiBase()}/api/user/profile`,
      filePath: avatarPath,
      name: "avatar",
      header: { Authorization: `Bearer ${token}` },
      formData: { nickname: name },
      success: (res) => {
        let body = {}
        try {
          body = typeof res.data === "string" ? JSON.parse(res.data) : res.data || {}
        } catch {
          body = {}
        }
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 200 && body.data) {
          const user = normalizeUser(body.data.user)
          saveSession(token, user)
          clearProfileDismiss()
          resolve(user)
          return
        }
        reject(new Error(body.msg || `保存失败(${res.statusCode})`))
      },
      fail: (err) => reject(err.errMsg ? new Error(err.errMsg) : err)
    })
  })
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
  callCloud,
  apiReady,
  needsProfileSetup,
  dismissProfileSetup,
  saveUserProfile
}
