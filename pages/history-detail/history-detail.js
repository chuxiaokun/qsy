const historyStore = require("../../utils/history")
const media = require("../../utils/media")

Page({
  data: {
    statusBarHeight: 0,
    record: null,
    timeLabel: "",
    hasLive: false,
    imageCurrent: 0,
    isSaving: false,
    isSavingLive: false,
    showProgress: false,
    progress: 0,
    progressLabel: "正在下载"
  },

  onLoad(options) {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    const record = historyStore.getById(options.id || "")
    this.setData({
      statusBarHeight,
      record,
      timeLabel: record ? historyStore.formatTimeLabel(record.createdAt) : "",
      hasLive: record ? historyStore.hasLivePhoto(record) : false
    })
    if (!record) {
      wx.showToast({ title: "记录不存在", icon: "none" })
      setTimeout(() => wx.navigateBack(), 800)
    }
  },

  goBack() {
    wx.navigateBack()
  },

  onSwiperChange(event) {
    this.setData({ imageCurrent: event.detail.current })
  },

  previewImages() {
    const urls = (this.data.record.images || []).map((item) => item.url).filter(Boolean)
    if (!urls.length) return
    wx.previewImage({
      urls,
      current: urls[this.data.imageCurrent] || urls[0]
    })
  },

  copyTitle() {
    const title = this.data.record?.title
    if (!title) {
      wx.showToast({ title: "暂无标题", icon: "none" })
      return
    }
    wx.setClipboardData({
      data: title,
      success: () => wx.showToast({ title: "标题已复制", icon: "success" })
    })
  },

  saveMedia() {
    if (this.data.isSaving || !this.data.record) return
    media.withPhotosAlbumAuth(() => {
      this.setData({
        isSaving: true,
        showProgress: true,
        progress: 0,
        progressLabel: this.data.record.videoUrl ? "正在下载视频" : "正在下载图片"
      })
      media
        .saveParseResult(this.data.record, {
          onProgress: (progress) => this.setData({ progress })
        })
        .then(() => {
          wx.showToast({ title: "已保存到相册", icon: "success" })
        })
        .catch(() => {
          wx.showToast({ title: "保存失败", icon: "none" })
        })
        .finally(() => {
          this.setData({ isSaving: false, showProgress: false, progress: 0 })
        })
    })
  },

  saveLive() {
    if (this.data.isSavingLive || !this.data.record) return
    const liveImages = (this.data.record.images || []).filter((item) => item.livePhotoUrl)
    if (!liveImages.length) return

    media.withPhotosAlbumAuth(() => {
      this.setData({
        isSavingLive: true,
        showProgress: true,
        progress: 0,
        progressLabel: "正在保存 Live Photo"
      })
      media
        .saveAllLivePhotos(liveImages, {
          onProgress: (progress) => this.setData({ progress })
        })
        .then(() => {
          wx.showToast({
            title: "已保存封面与动态视频",
            icon: "success"
          })
        })
        .catch(() => {
          wx.showToast({ title: "保存失败", icon: "none" })
        })
        .finally(() => {
          this.setData({ isSavingLive: false, showProgress: false, progress: 0 })
        })
    })
  },

  deleteRecord() {
    wx.showModal({
      title: "删除记录",
      content: "确定删除这条解析记录吗？",
      success: (res) => {
        if (!res.confirm || !this.data.record) return
        historyStore.removeRecord(this.data.record.id)
        wx.showToast({ title: "已删除", icon: "success" })
        setTimeout(() => wx.navigateBack(), 500)
      }
    })
  }
})
