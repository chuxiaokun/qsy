const { API_BASE } = require("./config")
const { getVersionLabel } = require("./version")

function apiBase() {
  return String(API_BASE || "").trim().replace(/\/$/, "")
}

function apiReady() {
  return !!apiBase()
}

/** 从 API 拉取展示文案，失败时回退本地 version.js */
function fetchVersionLabel() {
  return new Promise((resolve) => {
    const fallback = getVersionLabel()
    if (!apiReady()) {
      resolve(fallback)
      return
    }
    wx.request({
      url: `${apiBase()}/api/app/version`,
      method: "GET",
      success: (res) => {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 200) {
          const label = body.data && body.data.label
          if (label) {
            resolve(label)
            return
          }
        }
        resolve(fallback)
      },
      fail: () => resolve(fallback)
    })
  })
}

module.exports = {
  fetchVersionLabel
}
