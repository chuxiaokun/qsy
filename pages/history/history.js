const historyStore = require("../../utils/history")

Page({
  data: {
    statusBarHeight: 0,
    list: [],
    loading: true
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
  },

  onShow() {
    this.loadList()
  },

  loadList() {
    this.setData({ loading: true })
    historyStore
      .loadList()
      .then((records) => {
        this.setData({
          list: historyStore.getListForDisplay(records),
          loading: false
        })
      })
      .catch(() => {
        this.setData({
          list: historyStore.getListForDisplay(),
          loading: false
        })
      })
  },

  goBack() {
    wx.navigateBack()
  },

  goParse() {
    wx.navigateBack({
      fail: () => {
        wx.reLaunch({ url: "/pages/index/index" })
      }
    })
  },

  openDetail(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({ url: `/pages/history-detail/history-detail?id=${id}` })
  },

  clearAll() {
    wx.showModal({
      title: "清空记录",
      content: "确定删除全部解析记录吗？",
      success: (res) => {
        if (!res.confirm) return
        historyStore.clearAll().then(() => {
          this.loadList()
          wx.showToast({ title: "已清空", icon: "success" })
        })
      }
    })
  }
})
