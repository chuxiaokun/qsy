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
  }
})

