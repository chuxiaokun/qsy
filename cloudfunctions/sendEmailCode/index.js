const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/** 邮箱验证码：后续接入 SMTP / 腾讯云邮件，前期占位 */
exports.main = async (event) => {
  const email = (event && event.email ? String(event.email) : "").trim()
  if (!email) {
    return { code: 400, msg: "请填写邮箱" }
  }

  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { code: 401, msg: "请先登录" }
  }

  return {
    code: 501,
    msg: "邮件验证码服务配置中，请稍后再试"
  }
}
