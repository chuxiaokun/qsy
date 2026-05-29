const cloud = require("wx-server-sdk")
const https = require("https")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const PARSE_API = "https://qyapi.ipaybuy.cn/api/video"
const APP_ID = "116740"
const APP_KEY = "1a4f8drm5o0diutfrt90bd63m0a0c7lr"

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const target = new URL(url)
    const req = https.request(
      {
        hostname: target.hostname,
        path: target.pathname + target.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (res) => {
        let raw = ""
        res.on("data", (chunk) => {
          raw += chunk
        })
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw || "{}"))
          } catch (err) {
            reject(err)
          }
        })
      }
    )
    req.on("error", reject)
    req.write(body)
    req.end()
  })
}

exports.main = async (event) => {
  const url = (event && event.url ? String(event.url) : "").trim()
  if (!url) {
    return { code: 400, msg: "请提供链接" }
  }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { code: 401, msg: "请先登录" }
  }

  try {
    const body = await postJson(PARSE_API, {
      appId: APP_ID,
      appKey: APP_KEY,
      url
    })
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
  } catch (err) {
    console.error("parseVideo error", err)
    return { code: 500, msg: "解析服务异常" }
  }
}
