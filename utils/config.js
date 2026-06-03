/** 云开发环境 ID（邮箱绑定等仍走云函数时保留；解析已直连三方） */
const CLOUD_ENV = "cloud1-d7grtvpeze9385cea"

/** 自建 API 根地址；留空则登录仍走云函数 */
const API_BASE = "https://kit.baimengyan.cn"

/** 三方视频解析（小程序直连，须在公众平台配置 request 合法域名） */
const PARSE_API = "https://qyapi.ipaybuy.cn/api/video"
const PARSE_APP_ID = "116740"
const PARSE_APP_KEY = "1a4f8drm5o0diutfrt90bd63m0a0c7lr"

/** 微信激励式视频广告位 */
const REWARDED_VIDEO_AD_UNIT = "adunit-e086a08254a2c4ec"

/** 红包入口配置：拿到真实活动链接或小程序参数后填入即可 */
const RED_PACKET_ENTRANCES = {
  MEITUAN_WAIMAI: {
    appId: "wxde8ac0a21135c07d",
    path: "/index/pages/h5/h5?weburl=https%3A%2F%2Fmtunion.meituan.com%2Ffx%2Fcenter%3Ft%3D1%26c%3D2%26p%3D9ktMkrxzHV9b&f_token=0&f_userId=0&f_openId=0&f_openIdCipher=0&f_pos=1&f_ci=1&app_version=1",
    url: ""
  },
  JD_WAIMAI: {
    appId: "wx91d27dbf599dff74",
    path: "/pages/union/proxy/proxy?spreadUrl=https%3A%2F%2Fu.jd.com%2F7OI4Gzu",
    url: ""
  }
}

module.exports = {
  CLOUD_ENV,
  API_BASE,
  PARSE_API,
  PARSE_APP_ID,
  PARSE_APP_KEY,
  REWARDED_VIDEO_AD_UNIT,
  RED_PACKET_ENTRANCES
}
