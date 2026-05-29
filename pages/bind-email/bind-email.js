const auth = require("../../utils/auth")

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Page({
  data: {
    statusBarHeight: 0,
    email: "",
    code: "",
    boundEmail: "",
    countdown: 0,
    sendingCode: false,
    submitting: false
  },

  _timer: null,

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    const user = auth.getUser()
    const boundEmail = auth.isEmailBound(user) ? user.email : ""
    this.setData({
      statusBarHeight,
      email: boundEmail,
      boundEmail
    })
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },

  goBack() {
    wx.navigateBack()
  },

  onEmailInput(event) {
    this.setData({ email: (event.detail.value || "").trim() })
  },

  onCodeInput(event) {
    this.setData({ code: (event.detail.value || "").trim() })
  },

  startCountdown(seconds) {
    if (this._timer) clearInterval(this._timer)
    this.setData({ countdown: seconds })
    this._timer = setInterval(() => {
      const next = this.data.countdown - 1
      if (next <= 0) {
        clearInterval(this._timer)
        this._timer = null
        this.setData({ countdown: 0 })
        return
      }
      this.setData({ countdown: next })
    }, 1000)
  },

  sendCode() {
    const { email, countdown, sendingCode } = this.data
    if (countdown > 0 || sendingCode) return
    if (!EMAIL_RE.test(email)) {
      wx.showToast({ title: "请输入有效邮箱", icon: "none" })
      return
    }
    const user = auth.getUser()
    if (user && user.isLocal) {
      wx.showModal({
        title: "暂无法发送验证码",
        content: "用户服务接口尚未就绪。请先在后台配置 /api/mp/login 与邮箱验证码接口，或稍后再试。",
        showCancel: false
      })
      return
    }
    this.setData({ sendingCode: true })
    auth
      .sendEmailCode(email)
      .then(() => {
        wx.showToast({ title: "验证码已发送", icon: "success" })
        this.startCountdown(60)
      })
      .catch((err) => {
        wx.showToast({ title: err.message || "发送失败", icon: "none" })
      })
      .finally(() => {
        this.setData({ sendingCode: false })
      })
  },

  submitBind() {
    const { email, code, submitting } = this.data
    if (submitting) return
    if (!EMAIL_RE.test(email)) {
      wx.showToast({ title: "请输入有效邮箱", icon: "none" })
      return
    }
    if (!/^\d{6}$/.test(code)) {
      wx.showToast({ title: "请输入 6 位验证码", icon: "none" })
      return
    }
    const user = auth.getUser()
    if (user && user.isLocal) {
      wx.showModal({
        title: "暂无法绑定",
        content: "请先完成微信登录对接后台（code2Session），再绑定邮箱。",
        showCancel: false
      })
      return
    }
    this.setData({ submitting: true })
    auth
      .bindEmail(email, code)
      .then((updated) => {
        const app = getApp()
        if (app.globalData) app.globalData.user = updated
        wx.showToast({ title: "绑定成功", icon: "success" })
        setTimeout(() => wx.navigateBack(), 500)
      })
      .catch((err) => {
        wx.showToast({ title: err.message || "绑定失败", icon: "none" })
      })
      .finally(() => {
        this.setData({ submitting: false })
      })
  }
})
