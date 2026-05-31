const auth = require("./auth")

const STORAGE_DAILY_UNLOCK = "daily_ad_unlock_date"

let cachedCanUse = null
let cachedDailyUnlocked = false

function todayKey() {
  const d = new Date()
  const m = `${d.getMonth() + 1}`.padStart(2, "0")
  const day = `${d.getDate()}`.padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

function isVipUser(user) {
  if (!user) return false
  if (user.isVip === true) return true
  const exp = user.vipExpireAt
  if (!exp) return false
  return new Date(exp).getTime() > Date.now()
}

function hasLocalDailyUnlock() {
  return wx.getStorageSync(STORAGE_DAILY_UNLOCK) === todayKey()
}

function setLocalDailyUnlock() {
  wx.setStorageSync(STORAGE_DAILY_UNLOCK, todayKey())
  cachedDailyUnlocked = true
  cachedCanUse = true
}

function clearLocalDailyUnlock() {
  wx.removeStorageSync(STORAGE_DAILY_UNLOCK)
  cachedDailyUnlocked = false
}

function syncLocalDailyUnlock(isVip, dailyUnlocked) {
  // VIP 免广告不写本地标记，避免取消 VIP 后本地仍认为「今日已解锁」
  if (isVip) {
    clearLocalDailyUnlock()
    return
  }
  if (dailyUnlocked) setLocalDailyUnlock()
  else clearLocalDailyUnlock()
}

function canUseRemoveWatermark(user) {
  if (cachedCanUse === true) return true
  // 服务端已明确拒绝时，不再回退本地缓存（防止 VIP 取消后残留解锁）
  if (cachedCanUse === false) return false
  const u = user || auth.getUser()
  if (isVipUser(u)) return true
  if (cachedDailyUnlocked || hasLocalDailyUnlock()) return true
  return false
}

function refreshEntitlement() {
  const user = auth.getUser()

  if (!auth.apiReady() || !auth.getToken() || (user && user.isLocal)) {
    const canUse = hasLocalDailyUnlock()
    cachedCanUse = canUse
    cachedDailyUnlocked = canUse
    return Promise.resolve({
      canUse,
      isVip: false,
      dailyUnlocked: canUse
    })
  }

  return auth
    .requestApi("/api/user/entitlement", {}, "GET")
    .then((body) => {
      if (body.code === 200 && body.data) {
        const { canUse, isVip, dailyUnlocked } = body.data
        cachedCanUse = !!canUse
        cachedDailyUnlocked = !!dailyUnlocked
        syncLocalDailyUnlock(!!isVip, !!dailyUnlocked)
        if (user && !user.isLocal) {
          const next = {
            ...user,
            isVip: !!isVip,
            vipExpireAt: body.data.vipExpireAt || null
          }
          auth.saveSession(auth.getToken(), next)
          const app = getApp()
          if (app.globalData) app.globalData.user = next
        }
        return body.data
      }
      throw new Error(body.msg || "获取权限失败")
    })
    .catch(() => {
      const canUse = hasLocalDailyUnlock()
      cachedCanUse = canUse
      cachedDailyUnlocked = canUse
      return { canUse, isVip: false, dailyUnlocked: canUse }
    })
}

function grantDailyUnlock() {
  setLocalDailyUnlock()
  if (!auth.apiReady() || !auth.getToken()) {
    return Promise.resolve({ canUse: true, dailyUnlocked: true })
  }
  const user = auth.getUser()
  if (user && user.isLocal) {
    return Promise.resolve({ canUse: true, dailyUnlocked: true })
  }
  return auth.requestApi("/api/user/ad-unlock", {}).then((body) => {
    if (body.code === 200 && body.data) {
      cachedCanUse = !!body.data.canUse
      cachedDailyUnlocked = !!body.data.dailyUnlocked
      return body.data
    }
    throw new Error(body.msg || "解锁失败")
  })
}

function resetCache() {
  cachedCanUse = null
  cachedDailyUnlocked = false
  // 不清本地解锁日期；下次 refreshEntitlement 会按服务端结果同步
}

module.exports = {
  isVipUser,
  canUseRemoveWatermark,
  refreshEntitlement,
  grantDailyUnlock,
  resetCache
}
