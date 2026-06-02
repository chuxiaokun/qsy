const historyStore = require("../../utils/history")
const media = require("../../utils/media")
const auth = require("../../utils/auth")
const parseApi = require("../../utils/parse")
const entitlement = require("../../utils/entitlement")
const unlockGate = require("../../utils/unlock-gate")
const { getVersionLabel } = require("../../utils/version")
const appVersionApi = require("../../utils/app-version")
const appNotifications = require("../../utils/notifications")
const favoritesStore = require("../../utils/favorites")

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
    bgClass: "product-bg-violet",
    page: "/pages/image-compress/image-compress"
  }
]

const menuItems = [
  { id: "history", name: "处理记录", iconClass: "icon-history", description: "查看历史记录" },
  { id: "favorites", name: "我的收藏", iconClass: "icon-star", description: "收藏的内容", badge: "", badgeClass: "badge-primary" },
  { id: "notifications", name: "消息通知", iconClass: "icon-bell", description: "系统消息", badge: "", badgeClass: "badge-hot" },
  { id: "invite", name: "邀请好友", iconClass: "icon-gift", description: "分享给好友" }
]

const settingsItems = [
  // { id: "settings", name: "设置", iconClass: "icon-settings" },
  // { id: "help", name: "帮助中心", iconClass: "icon-help" },
  { id: "feedback", name: "意见反馈", iconClass: "icon-message" },
  { id: "privacy", name: "隐私政策", iconClass: "icon-shield" },
  // { id: "terms", name: "用户协议", iconClass: "icon-file" }
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
    isFavorited: false,
    isSavingLive: false,
    platforms,
    products,
    menuItems,
    settingsItems,
    user: { nickname: "游客", isGuest: true },
    userDisplayId: "——",
    userInitial: "游",
    emailBound: false,
    usageCount: 0,
    showProfileModal: false,
    modalAvatarUrl: "",
    modalNickname: "",
    profileSaving: false,
    showUnlockModal: false,
    showVipContactModal: false,
    adUnlockLoading: false,
    isVip: false,
    appVersion: getVersionLabel(),
    noticeQueue: [],
    showNoticeModal: false,
    currentNotice: null
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
    this.initUser()
    this.loadAppVersion()
  },

  loadAppVersion() {
    appVersionApi.fetchVersionLabel().then((label) => {
      if (label) this.setData({ appVersion: label })
    })
  },

  onShow() {
    if (this.data.activeTab === "profile") {
      this.refreshProfile()
    }
    entitlement.refreshEntitlement().then(() => {
      const user = auth.getUser()
      if (user) this.setData({ isVip: entitlement.isVipUser(user) })
    })
    if (this.data.activeTab === "remove") {
      this.loadAndShowNotificationsOnce()
    }
    if (this.data.activeTab === "profile") {
      this.refreshMenuBadges()
    }
  },

  initUser() {
    auth.ensureLogin().then((user) => {
      const app = getApp()
      if (app.globalData) app.globalData.user = user
      this.applyUser(user)
      entitlement.refreshEntitlement()
    })
  },

  applyUser(user) {
    if (!user) return
    this.setData({
      user,
      userDisplayId: auth.getDisplayId(user),
      userInitial: auth.getAvatarInitial(user),
      emailBound: auth.isEmailBound(user),
      isVip: entitlement.isVipUser(user)
    })
  },

  refreshProfile() {
    const user = auth.refreshUserFromStorage() || getApp().globalData.user
    if (user) this.applyUser(user)

    const remoteRefresh =
      auth.apiReady() && auth.getToken() && user && !user.isLocal
        ? auth.fetchUserProfile().then((fresh) => {
            entitlement.resetCache()
            return entitlement.refreshEntitlement().then(() => fresh)
          })
        : Promise.resolve(user)

    remoteRefresh
      .then((fresh) => {
        const latest = auth.getUser() || fresh
        if (latest) {
          const app = getApp()
          if (app.globalData) app.globalData.user = latest
          this.applyUser(latest)
        }
      })
      .catch(() => {})

    historyStore.getCount().then((count) => {
      this.setData({ usageCount: count })
    })
    this.refreshMenuBadges()
    this.maybeShowProfileModal(auth.getUser() || user)
  },

  refreshMenuBadges() {
    Promise.all([
      favoritesStore.getCount().catch(() => 0),
      appNotifications.fetchActiveWithRead().catch(() => ({ unreadCount: 0 }))
    ]).then(([favCount, notice]) => {
      const unread = Number(notice.unreadCount) || 0
      const next = (this.data.menuItems || []).map((item) => {
        if (item.id === "favorites") {
          return { ...item, badge: favCount ? String(favCount) : "" }
        }
        if (item.id === "notifications") {
          return { ...item, badge: unread ? String(unread) : "" }
        }
        return item
      })
      this.setData({ menuItems: next })
    })
  },

  maybeShowProfileModal(user) {
    const u = user || auth.refreshUserFromStorage() || getApp().globalData.user
    if (!auth.needsProfileSetup(u)) return
    this.setData({
      showProfileModal: true,
      modalAvatarUrl: "",
      modalNickname: u.nickname && !/^用户\d{4}$/.test(u.nickname) ? u.nickname : ""
    })
  },

  switchTab(event) {
    const tab = event.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    if (tab === "profile") this.refreshProfile()
  },

  loadAndShowNotificationsOnce() {
    const app = getApp()
    if (!app.globalData || app.globalData.homeNotificationsShown) return
    app.globalData.homeNotificationsShown = true
    this.loadAndShowNotifications()
  },

  loadAndShowNotifications() {
    appNotifications.fetchActiveNotifications().then((list) => {
      const items = (list || []).filter((item) => item && item.title)
      if (!items.length) return
      this.setData({ noticeQueue: items })
      this.showNextNotice()
    })
  },

  canShowNoticeNow() {
    const {
      showProfileModal,
      showUnlockModal,
      showVipContactModal,
      showNoticeModal
    } = this.data
    return !showProfileModal && !showUnlockModal && !showVipContactModal && !showNoticeModal
  },

  showNextNotice() {
    if (!this.canShowNoticeNow()) return
    const queue = this.data.noticeQueue || []
    if (!queue.length) {
      this.setData({ showNoticeModal: false, currentNotice: null })
      return
    }
    const [currentNotice, ...rest] = queue
    this.setData({
      noticeQueue: rest,
      currentNotice,
      showNoticeModal: true
    })
  },

  onDismissNotice() {
    this.setData({ showNoticeModal: false, currentNotice: null })
    setTimeout(() => this.showNextNotice(), 200)
  },

  preventNoticeModalMove() {},

  onModalChooseAvatar(event) {
    const { avatarUrl } = event.detail || {}
    if (avatarUrl) this.setData({ modalAvatarUrl: avatarUrl })
  },

  onModalNicknameInput(event) {
    this.setData({ modalNickname: (event.detail && event.detail.value) || "" })
  },

  onModalNicknameBlur(event) {
    const value = (event.detail && event.detail.value) || ""
    if (value) this.setData({ modalNickname: value })
  },

  onDismissProfileModal() {
    auth.dismissProfileSetup()
    this.setData({ showProfileModal: false })
  },

  onSaveProfile() {
    const { modalAvatarUrl, modalNickname, profileSaving } = this.data
    if (profileSaving) return
    const nickname = (modalNickname || "").trim()
    if (!modalAvatarUrl) {
      wx.showToast({ title: "请先选择头像", icon: "none" })
      return
    }
    if (!nickname) {
      wx.showToast({ title: "请填写昵称", icon: "none" })
      return
    }
    this.setData({ profileSaving: true })
    auth
      .saveUserProfile(modalAvatarUrl, nickname)
      .then((user) => {
        const app = getApp()
        if (app.globalData) app.globalData.user = user
        this.applyUser(user)
        this.setData({ showProfileModal: false, profileSaving: false })
        wx.showToast({ title: "资料已保存", icon: "success" })
      })
      .catch((err) => {
        this.setData({ profileSaving: false })
        wx.showToast({ title: (err && err.message) || "保存失败", icon: "none" })
      })
  },

  preventModalMove() {},

  goBindEmail() {
    wx.navigateTo({ url: "/pages/bind-email/bind-email" })
  },

  onComingSoon() {
    unlockGate.onOpenVipModal(this)
  },

  onDismissUnlockModal() {
    unlockGate.closeUnlockModal(this)
  },

  onWatchAdUnlock() {
    unlockGate.onWatchAdUnlock(this)
  },

  onUnlockGoVip() {
    unlockGate.onOpenVipModal(this)
  },

  onCloseVipContactModal() {
    unlockGate.onCloseVipContactModal(this)
  },

  preventUnlockModalMove() {},

  onMenuTap(event) {
    const { id } = event.currentTarget.dataset
    if (id === "history") {
      wx.navigateTo({ url: "/pages/history/history" })
      return
    }
    if (id === "favorites") {
      wx.navigateTo({ url: "/pages/favorites/favorites" })
      return
    }
    if (id === "notifications") {
      wx.navigateTo({ url: "/pages/notifications/notifications" })
      return
    }
    if (id === "invite") {
      wx.navigateTo({ url: "/pages/invite/invite" })
    }
  },

  onSettingTap(event) {
    const { id } = event.currentTarget.dataset
    if (id === "privacy") {
      wx.navigateTo({ url: "/pages/privacy/privacy" })
      return
    }
    if (id === "terms") {
      wx.navigateTo({ url: "/pages/terms/terms" })
      return
    }
    if (id === "feedback") {
      wx.navigateTo({ url: "/pages/feedback/feedback" })
      return
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

  pasteFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        const value = ((res && res.data) || "").trim()
        if (!value) {
          wx.showToast({ title: "剪贴板为空", icon: "none" })
          return
        }
        this.setData({ linkInput: value })
      },
      fail: () => {
        wx.showToast({ title: "读取剪贴板失败", icon: "none" })
      }
    })
  },

  continueParse() {
    this.resetDownloadProgress()
    this.setData({
      linkInput: "",
      showParseResult: false,
      parseResult: null,
      images: [],
      imageCurrent: 0,
      hasLivePhoto: false,
      isFavorited: false
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
    const link = this.data.linkInput.trim()

    const runParse = () => {
      this.setData({
        isProcessing: true,
        showParseResult: false,
        parseResult: null,
        images: [],
        imageCurrent: 0,
        hasLivePhoto: false
      })
      parseApi
        .parseLink(link)
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

            historyStore
              .addRecord({
                sourceUrl: link,
                title: parseResult.title,
                videoUrl: parseResult.videoUrl,
                images
              })
              .then(() => {
                this.setData({
                  showParseResult: true,
                  parseResult,
                  images,
                  imageCurrent: 0,
                  hasLivePhoto,
                  isFavorited: favoritesStore.existsLocal(link)
                })
                if (this.data.activeTab === "profile") {
                  historyStore.getCount().then((count) => {
                    this.setData({ usageCount: count })
                  })
                }
                this.refreshMenuBadges()
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
            title: (err && err.message) || "解析请求失败",
            icon: "none"
          })
        })
        .finally(() => {
          this.setData({ isProcessing: false })
        })
    }

    unlockGate.requestUnlock(this, runParse)
  },

  toggleFavorite() {
    if (!this.data.showParseResult) return
    const sourceUrl = (this.data.linkInput || "").trim()
    const title = this.data.parseResult?.title || ""
    const videoUrl = this.data.parseResult?.videoUrl || ""
    const images = this.data.images || []

    if (!sourceUrl) return

    if (this.data.isFavorited) {
      const existing = (favoritesStore.getLocalList() || []).find(
        (it) => String(it.sourceUrl || it.source_url || "").trim() === sourceUrl
      )
      if (!existing) {
        this.setData({ isFavorited: false })
        this.refreshMenuBadges()
        return
      }
      favoritesStore
        .removeFavorite(existing)
        .then(() => {
          this.setData({ isFavorited: false })
          this.refreshMenuBadges()
          wx.showToast({ title: "已取消收藏", icon: "success" })
        })
        .catch(() => {
          wx.showToast({ title: "取消失败", icon: "none" })
        })
      return
    }

    favoritesStore
      .addFavorite({ sourceUrl, title, videoUrl, images })
      .then(() => {
        this.setData({ isFavorited: true })
        this.refreshMenuBadges()
        wx.showToast({ title: "已收藏", icon: "success" })
      })
      .catch((err) => {
        wx.showToast({ title: (err && err.message) || "收藏失败", icon: "none" })
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

    const doSave = () => {
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
    }

    unlockGate.requestUnlock(this, doSave)
  },

  saveLivePhotos() {
    const liveImages = (this.data.images || []).filter((item) => item.livePhotoUrl)
    if (!liveImages.length || this.data.isSavingLive) return

    const doSave = () => {
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

    unlockGate.requestUnlock(this, doSave)
  },

  onShareAppMessage() {
    return {
      title: "去水印工具箱：解析预览，一键保存高清内容",
      path: "/pages/index/index"
    }
  }
})
