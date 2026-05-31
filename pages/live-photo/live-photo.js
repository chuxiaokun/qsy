const historyStore = require("../../utils/history")
const media = require("../../utils/media")

Page({
  data: {
    statusBarHeight: 0,
    items: [],
    savingId: "",
    showProgress: false,
    progress: 0
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
  },

  onShow() {
    historyStore.loadList().then((records) => {
      this.setData({ items: historyStore.getLivePhotoItems(records) })
    })
  },

  goBack() {
    wx.navigateBack()
  },

  goParse() {
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: "/pages/index/index" })
    })
  },

  saveItem(event) {
    const { id } = event.currentTarget.dataset
    const item = this.data.items.find((row) => row.id === id)
    if (!item || this.data.savingId) return

    media.withPhotosAlbumAuth(() => {
      this.setData({ savingId: id, showProgress: true, progress: 0 })
      media
        .saveLivePhotoPair({ url: item.url, livePhotoUrl: item.livePhotoUrl })
        .then(() => {
          wx.showToast({ title: "已保存封面与动态视频", icon: "success" })
        })
        .catch(() => {
          wx.showToast({ title: "保存失败", icon: "none" })
        })
        .finally(() => {
          this.setData({ savingId: "", showProgress: false, progress: 0 })
        })
    })
  },

  saveAll() {
    if (this.data.savingId || !this.data.items.length) return
    const images = this.data.items.map((item) => ({
      url: item.url,
      livePhotoUrl: item.livePhotoUrl
    }))

    media.withPhotosAlbumAuth(() => {
      this.setData({ savingId: "all", showProgress: true, progress: 0 })
      media
        .saveAllLivePhotos(images)
        .then(() => {
          wx.showToast({ title: "全部保存完成", icon: "success" })
        })
        .catch(() => {
          wx.showToast({ title: "保存失败", icon: "none" })
        })
        .finally(() => {
          this.setData({ savingId: "", showProgress: false, progress: 0 })
        })
    })
  }
})
