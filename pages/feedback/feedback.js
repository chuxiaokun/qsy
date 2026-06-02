const { API_BASE } = require("../../utils/config")
const auth = require("../../utils/auth")

function apiBase() {
  return String(API_BASE || "").trim().replace(/\/$/, "")
}

Page({
  data: {
    statusBarHeight: 0,
    content: "",
    contact: "",
    submitting: false
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
  },

  goBack() {
    wx.navigateBack()
  },

  onContentInput(event) {
    this.setData({ content: (event.detail && event.detail.value) || "" })
  },

  onContactInput(event) {
    this.setData({ contact: (event.detail && event.detail.value) || "" })
  },

  submit() {
    const content = (this.data.content || "").trim()
    const contact = (this.data.contact || "").trim()
    if (this.data.submitting) return
    if (!content) {
      wx.showToast({ title: "请填写反馈内容", icon: "none" })
      return
    }
    if (!apiBase()) {
      wx.showToast({ title: "未配置 API_BASE，暂无法提交", icon: "none" })
      return
    }

    this.setData({ submitting: true })

    const systemInfo = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
    const token = auth.getToken()
    const header = { "content-type": "application/json" }
    if (token && !String(token).startsWith("local_")) header.Authorization = `Bearer ${token}`

    wx.request({
      url: `${apiBase()}/api/feedback`,
      method: "POST",
      header,
      data: {
        content,
        contact,
        page: "miniprogram/feedback",
        systemInfo
      },
      success: (res) => {
        const body = res.data || {}
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 200) {
          wx.showToast({ title: "已提交", icon: "success" })
          this.setData({ content: "", contact: "" })
          setTimeout(() => this.goBack(), 500)
          return
        }
        wx.showToast({ title: body.msg || "提交失败", icon: "none" })
      },
      fail: (err) => {
        wx.showToast({ title: (err && err.errMsg) || "网络错误", icon: "none" })
      },
      complete: () => {
        this.setData({ submitting: false })
      }
    })
  }
})

