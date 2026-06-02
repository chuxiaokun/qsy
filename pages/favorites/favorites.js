const favoritesStore = require("../../utils/favorites")

Page({
  data: {
    statusBarHeight: 0,
    list: [],
    loading: true,
    q: ""
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
  },

  onShow() {
    this.loadList()
  },

  noop() {},

  loadList() {
    this.setData({ loading: true })
    favoritesStore
      .loadList()
      .then((items) => {
        const list = favoritesStore.getListForDisplay(items)
        this.setData({ list: this.filterList(list, this.data.q), loading: false })
      })
      .catch(() => {
        const list = favoritesStore.getListForDisplay()
        this.setData({ list: this.filterList(list, this.data.q), loading: false })
      })
  },

  filterList(list, q) {
    const keyword = String(q || "").trim()
    if (!keyword) return list
    return (list || []).filter((item) => {
      const hay = `${item.title || ""} ${item.sourceUrl || ""} ${item.platform || ""}`
      return hay.includes(keyword)
    })
  },

  onQueryInput(event) {
    const q = (event.detail && event.detail.value) || ""
    const full = favoritesStore.getListForDisplay()
    this.setData({ q, list: this.filterList(full, q) })
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
    const item = (this.data.list || []).find((it) => String(it.id) === String(id))
    if (!item || !item.sourceUrl) return
    wx.setClipboardData({
      data: item.sourceUrl,
      success: () => {
        wx.showToast({ title: "链接已复制", icon: "success" })
      }
    })
  },

  removeOne(event) {
    const { id } = event.currentTarget.dataset
    const item = (this.data.list || []).find((it) => String(it.id) === String(id))
    if (!item) return
    wx.showModal({
      title: "移除收藏",
      content: "确定从收藏中移除该条目吗？",
      success: (res) => {
        if (!res.confirm) return
        favoritesStore.removeFavorite(item).then(() => {
          this.loadList()
          wx.showToast({ title: "已移除", icon: "success" })
        })
      }
    })
  },

  clearAll() {
    wx.showModal({
      title: "清空收藏",
      content: "确定清空全部收藏吗？（本地列表将被清空）",
      success: (res) => {
        if (!res.confirm) return
        // 仅清空本地；服务端清空可后续补齐批量接口
        wx.setStorageSync("mp_favorites", [])
        this.loadList()
        wx.showToast({ title: "已清空", icon: "success" })
      }
    })
  }
})

