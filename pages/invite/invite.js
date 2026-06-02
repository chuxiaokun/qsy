Page({
  data: {
    statusBarHeight: 0
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
  },

  goBack() {
    wx.navigateBack()
  },

  goHome() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: "/pages/index/index" })
      }
    })
  },

  onShareAppMessage() {
    return {
      title: "去水印工具箱：解析预览，一键保存高清内容",
      path: "/pages/index/index"
    }
  }
})

