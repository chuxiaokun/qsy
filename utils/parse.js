const { PARSE_API, PARSE_APP_ID, PARSE_APP_KEY } = require("./config")

function parseLink(url) {
  const link = (url || "").trim()
  if (!link) {
    return Promise.reject(new Error("请提供链接"))
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: PARSE_API,
      method: "POST",
      header: { "content-type": "application/json" },
      data: {
        appId: PARSE_APP_ID,
        appKey: PARSE_APP_KEY,
        url: link
      },
      success: (res) => {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(normalizeBody(body))
          return
        }
        reject(new Error(body.msg || `解析请求失败(${res.statusCode})`))
      },
      fail: (err) => reject(err.errMsg ? new Error(err.errMsg) : err)
    })
  })
}

function normalizeBody(body) {
  if (body.code === 200 && body.data) {
    return {
      code: 200,
      data: {
        title: body.data.title || "",
        video_url: body.data.video_url || "",
        images: (body.data.images || []).map((item) => ({
          url: item.url || "",
          live_photo_url: item.live_photo_url || ""
        }))
      }
    }
  }
  return { code: body.code || 500, msg: body.msg || "解析失败" }
}

module.exports = {
  parseLink
}
