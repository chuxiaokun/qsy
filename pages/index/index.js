const historyStore = require("../../utils/history")
const media = require("../../utils/media")
const auth = require("../../utils/auth")

const platforms = [
  { id: "douyin", name: "抖音", dotClass: "dot-pink" },
  { id: "kuaishou", name: "快手", dotClass: "dot-orange" },
  { id: "xiaohongshu", name: "小红书", dotClass: "dot-red" },
  { id: "weibo", name: "微博", dotClass: "dot-yellow" },
  { id: "bilibili", name: "B站", dotClass: "dot-blue" },
  { id: "weishi", name: "微视", dotClass: "dot-green" }
]

const products = [
  {
    id: "live-photo",
    name: "Live Photo 保存",
    description: "保存图集 Live 封面与动态视频",
    iconClass: "icon-live",
    colorClass: "product-pink",
    bgClass: "product-bg-pink",
    badge: "推荐",
    badgeClass: "badge-hot",
    page: "/pages/live-photo/live-photo"
  },
  {
    id: "format-convert",
    name: "格式转换",
    description: "HEIC 转 JPG、视频转 GIF",
    iconClass: "icon-convert",
    colorClass: "product-sky",
    bgClass: "product-bg-sky",
    page: "/pages/format-convert/format-convert"
  },
  {
    id: "image-compress",
    name: "图片压缩",
    description: "无损压缩图片，减少文件大小",
    iconClass: "icon-image",
    colorClass: "product-violet",
    bgClass: "product-bg-violet"
  }
]

const menuItems = [
  { id: "history", name: "处理记录", iconClass: "icon-history", description: "查看历史记录" },
  { id: "favorites", name: "我的收藏", iconClass: "icon-star", description: "收藏的内容", badge: "3", badgeClass: "badge-primary" },
  { id: "notifications", name: "消息通知", iconClass: "icon-bell", description: "系统消息", badge: "2", badgeClass: "badge-hot" },
  { id: "invite", name: "邀请好友", iconClass: "icon-gift", description: "分享给好友" }
]

const settingsItems = [
  { id: "settings", name: "设置", iconClass: "icon-settings" },
  { id: "help", name: "帮助中心", iconClass: "icon-help" },
  { id: "feedback", name: "意见反馈", iconClass: "icon-message" },
  { id: "privacy", name: "隐私政策", iconClass: "icon-shield" },
  { id: "terms", name: "用户协议", iconClass: "icon-file" }
]

Page({
  data: {
    statusBarHeight: 0,
    activeTab: "remove",
    linkInput: "",
    isProcessing: false,
    isSavingVideo: false,
    showDownloadProgress: false,
    downloadProgress: 0,
    downloadPhase: "downloading",
    showParseResult: false,
    parseResult: null,
    images: [],
    imageCurrent: 0,
    hasLivePhoto: false,
    isSavingLive: false,
    platforms,
    products,
    menuItems,
    settingsItems,
    user: { nickname: "游客", isGuest: true },
    userDisplayId: "——",
    userInitial: "游",
    emailBound: false,
    usageCount: 0
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
    this.initUser()
  },

  onShow() {
    if (this.data.activeTab === "profile") {
      this.refreshProfile()
    }
  },

  initUser() {
    auth.ensureLogin().then((user) => {
      const app = getApp()
      if (app.globalData) app.globalData.user = user
      this.applyUser(user)
    })
  },

  applyUser(user) {
    if (!user) return
    this.setData({
      user,
      userDisplayId: auth.getDisplayId(user),
      userInitial: auth.getAvatarInitial(user),
      emailBound: auth.isEmailBound(user)
    })
  },

  refreshProfile() {
    const user = auth.refreshUserFromStorage() || getApp().globalData.user
    if (user) this.applyUser(user)
    this.setData({ usageCount: historyStore.getList().length })
  },

  switchTab(event) {
    const tab = event.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    if (tab === "profile") this.refreshProfile()
  },

  goBindEmail() {
    wx.navigateTo({ url: "/pages/bind-email/bind-email" })
  },

  onComingSoon() {
    wx.showToast({ title: "即将上线，敬请期待", icon: "none" })
  },

  onMenuTap(event) {
    const { id } = event.currentTarget.dataset
    if (id === "history") {
      wx.navigateTo({ url: "/pages/history/history" })
    }
  },

  onProductTap(event) {
    const { page } = event.currentTarget.dataset
    if (page) wx.navigateTo({ url: page })
  },

  onLinkInput(event) {
    this.setData({ linkInput: event.detail.value })
  },

  clearLink() {
    this.setData({ linkInput: "" })
  },

  continueParse() {
    this.resetDownloadProgress()
    this.setData({
      linkInput: "",
      showParseResult: false,
      parseResult: null,
      images: [],
      imageCurrent: 0,
      hasLivePhoto: false
    })
  },

  resetDownloadProgress() {
    this.setData({
      isSavingVideo: false,
      isSavingLive: false,
      showDownloadProgress: false,
      downloadProgress: 0,
      downloadPhase: "downloading"
    })
  },

  handleProcess() {
    if (!this.data.linkInput.trim() || this.data.isProcessing) return
    this.setData({
      isProcessing: true,
      showParseResult: false,
      parseResult: null,
      images: [],
      imageCurrent: 0,
      hasLivePhoto: false
    })
    const link = this.data.linkInput.trim()
    auth
      .callCloud("parseVideo", { url: link })
      .then((body) => {
        if (body.code === 200 && body.data) {
          wx.showToast({
            title: "解析成功",
            icon: "success"
          })
          const images = (body.data.images || [])
            .map((item) => ({
              url: item.url || "",
              livePhotoUrl: item.live_photo_url || ""
            }))
            .filter((item) => item.url)

          const parseResult = {
            videoUrl: body.data.video_url || "",
            title: body.data.title || ""
          }
          const hasLivePhoto = images.some((item) => item.livePhotoUrl)

          historyStore.addRecord({
            sourceUrl: link,
            title: parseResult.title,
            videoUrl: parseResult.videoUrl,
            images
          })

          this.setData({
            showParseResult: true,
            parseResult,
            images,
            imageCurrent: 0,
            hasLivePhoto
          })
          return
        }
        wx.showToast({
          title: body.msg || "解析失败",
          icon: "none"
        })
      })
      .catch((err) => {
        wx.showToast({
          title: (err && err.message) || "云函数调用失败，请确认已部署 parseVideo",
          icon: "none"
        })
      })
      .finally(() => {
        this.setData({ isProcessing: false })
      })
  },

  copyTitle() {
    const title = this.data.parseResult?.title
    if (!title) return
    wx.setClipboardData({
      data: title,
      success: () => {
        wx.showToast({
          title: "标题已复制",
          icon: "success"
        })
      }
    })
  },

  onImageSwiperChange(event) {
    this.setData({ imageCurrent: event.detail.current })
  },

  previewImages() {
    const urls = (this.data.images || []).map((item) => item.url).filter(Boolean)
    if (!urls.length) return
    wx.previewImage({
      urls,
      current: urls[this.data.imageCurrent] || urls[0]
    })
  },

  saveVideo() {
    const videoUrl = this.data.parseResult?.videoUrl
    const images = this.data.images || []
    if (this.data.isSavingVideo) return
    if (!videoUrl && !images.length) return

    media.withPhotosAlbumAuth(() => {
      this.setData({
        isSavingVideo: true,
        showDownloadProgress: true,
        downloadProgress: 0,
        downloadPhase: "downloading"
      })
      media
        .saveParseResult({ videoUrl, images }, {
          onProgress: (progress) => this.setData({ downloadProgress: progress })
        })
        .then(() => {
          this.setData({ downloadProgress: 100, downloadPhase: "saving" })
          const total = images.length
          wx.showToast({
            title: videoUrl ? "已保存到相册" : total > 1 ? `已保存 ${total} 张图片` : "已保存到相册",
            icon: "success"
          })
          setTimeout(() => this.resetDownloadProgress(), 400)
        })
        .catch((err) => {
          const denied = err && err.errMsg && err.errMsg.includes("auth deny")
          wx.showToast({
            title: denied ? "请授权相册权限" : "保存失败",
            icon: "none"
          })
          this.resetDownloadProgress()
        })
    })
  },

  saveLivePhotos() {
    const liveImages = (this.data.images || []).filter((item) => item.livePhotoUrl)
    if (!liveImages.length || this.data.isSavingLive) return

    media.withPhotosAlbumAuth(() => {
      this.setData({
        isSavingLive: true,
        showDownloadProgress: true,
        downloadProgress: 0,
        downloadPhase: "downloading"
      })
      media
        .saveAllLivePhotos(liveImages, {
          onProgress: (progress) => this.setData({ downloadProgress: progress })
        })
        .then(() => {
          this.setData({ downloadProgress: 100, downloadPhase: "saving" })
          wx.showToast({ title: "已保存封面与动态视频", icon: "success" })
          setTimeout(() => this.resetDownloadProgress(), 400)
        })
        .catch(() => {
          wx.showToast({ title: "保存失败", icon: "none" })
          this.resetDownloadProgress()
        })
    })
  }
})
