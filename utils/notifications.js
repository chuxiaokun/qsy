const { API_BASE } = require("./config")

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

module.exports = {
  fetchActiveNotifications
}
