const auth = require("./utils/auth")

App({
  globalData: {
    user: null
  },

  onLaunch() {
    auth.ensureLogin().then((user) => {
      this.globalData.user = user
    })
  }
})
