const auth = require("./utils/auth")
const { CLOUD_ENV } = require("./utils/config")

App({
  globalData: {
    user: null
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上基础库以启用云开发")
    } else {
      wx.cloud.init({
        env: CLOUD_ENV,
        traceUser: true
      })
    }

    auth.ensureLogin().then((user) => {
      this.globalData.user = user
    })
  }
})
