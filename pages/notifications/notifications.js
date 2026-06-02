const appNotifications = require("../../utils/notifications")

Page({
  data: {
    statusBarHeight: 0,
    list: [],
    loading: true,
    showModal: false,
    current: null
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
  },

  onShow() {
    this.refresh()
  },

  goBack() {
    wx.navigateBack()
  },

  preventMove() {},

  refresh() {
    this.setData({ loading: true })
    appNotifications
      .fetchActiveWithRead()
      .then((data) => {
        const list = (data.notifications || []).filter((it) => it && it.title)
        this.setData({ list, loading: false })
      })
      .catch(() => {
        appNotifications.fetchActiveNotifications().then((list) => {
          this.setData({
            list: (list || []).map((it) => ({ ...it, read: false })),
            loading: false
          })
        })
      })
  },

  openNotice(event) {
    const { id } = event.currentTarget.dataset
    const current = (this.data.list || []).find((it) => String(it.id) === String(id))
    if (!current) return
    this.setData({ showModal: true, current })
    if (!current.read) {
      appNotifications
        .markRead(current.id)
        .then(() => {
          const list = (this.data.list || []).map((it) =>
            it.id === current.id ? { ...it, read: true } : it
          )
          this.setData({ list, current: { ...current, read: true } })
        })
        .catch(() => {})
    }
  },

  closeModal() {
    this.setData({ showModal: false, current: null })
  }
})

