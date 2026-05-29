const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/** 邮箱绑定：后续与 sendEmailCode 联动校验 */
exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) {
    return { code: 401, msg: "请先登录" }
  }

  return {
    code: 501,
    msg: "邮箱绑定服务配置中，请稍后再试"
  }
}
