const { API_BASE } = require("./config")
const auth = require("./auth")

function apiReady() {
  return !!(API_BASE && String(API_BASE).trim())
}

function apiBase() {
  return String(API_BASE).trim().replace(/\/$/, "")
}

function fetchActiveNotifications() {
  return new Promise((resolve) => {
    if (!apiReady()) {
      resolve([])
      return
    }
    wx.request({
      url: `${apiBase()}/api/notifications/active`,
      method: "GET",
      success: (res) => {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 200) {
          resolve((body.data && body.data.notifications) || [])
          return
        }
        resolve([])
      },
      fail: () => resolve([])
    })
  })
}

function canUseApiRead() {
  const user = auth.getUser()
  return auth.apiReady() && !!auth.getToken() && user && !user.isLocal
}

async function fetchActiveWithRead() {
  if (!canUseApiRead()) {
    const list = await fetchActiveNotifications()
    return { notifications: (list || []).map((it) => ({ ...it, read: false })), unreadCount: 0 }
  }
  const body = await auth.requestApi("/api/user/notifications/active", {}, "GET")
  if (body.code === 200 && body.data) {
    return {
      notifications: body.data.notifications || [],
      unreadCount: Number(body.data.unreadCount) || 0
    }
  }
  return { notifications: [], unreadCount: 0 }
}

async function markRead(id) {
  if (!canUseApiRead()) return false
  const body = await auth.requestApi(`/api/user/notifications/${id}/read`, {}, "POST")
  return body.code === 200
}

module.exports = {
  fetchActiveNotifications,
  fetchActiveWithRead,
  markRead
}
