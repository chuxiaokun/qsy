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
    id: "ai-enhance",
    name: "AI 图片增强",
    description: "智能提升画质，让模糊图片焕然一新",
    iconClass: "icon-wand",
    colorClass: "product-violet",
    bgClass: "product-bg-violet",
    badge: "热门",
    badgeClass: "badge-hot"
  },
  {
    id: "bg-remove",
    name: "智能抠图",
    description: "一键去除背景，精准边缘识别",
    iconClass: "icon-scissors",
    colorClass: "product-pink",
    bgClass: "product-bg-pink",
    badge: "新品",
    badgeClass: "badge-primary"
  },
  {
    id: "image-compress",
    name: "图片压缩",
    description: "无损压缩图片，减少文件大小",
    iconClass: "icon-image",
    colorClass: "product-sky",
    bgClass: "product-bg-sky"
  },
  {
    id: "pdf-tools",
    name: "PDF 工具箱",
    description: "PDF 转换、合并、拆分一站式服务",
    iconClass: "icon-file",
    colorClass: "product-amber",
    bgClass: "product-bg-amber"
  },
  {
    id: "qr-generator",
    name: "二维码生成",
    description: "创建精美二维码，支持自定义样式",
    iconClass: "icon-qr",
    colorClass: "product-emerald",
    bgClass: "product-bg-emerald"
  },
  {
    id: "color-picker",
    name: "配色方案",
    description: "AI 推荐配色，设计灵感助手",
    iconClass: "icon-palette",
    colorClass: "product-indigo",
    bgClass: "product-bg-indigo"
  }
]

const menuItems = [
  { id: "history", name: "处理记录", iconClass: "icon-history", description: "查看历史记录" },
  { id: "favorites", name: "我的收藏", iconClass: "icon-star", description: "收藏的内容", badge: "3", badgeClass: "badge-primary" },
  { id: "notifications", name: "消息通知", iconClass: "icon-bell", description: "系统消息", badge: "2", badgeClass: "badge-hot" },
  { id: "invite", name: "邀请好友", iconClass: "icon-gift", description: "邀请得会员" }
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
    activeMode: "link",
    linkInput: "",
    isProcessing: false,
    isSavingVideo: false,
    showDownloadProgress: false,
    downloadProgress: 0,
    downloadPhase: "downloading",
    showParseResult: false,
    parseResult: null,
    platforms,
    products,
    menuItems,
    settingsItems
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  },

  switchMode(event) {
    this.setData({ activeMode: event.currentTarget.dataset.mode })
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
      parseResult: null
    })
  },

  resetDownloadProgress() {
    this.setData({
      isSavingVideo: false,
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
      parseResult: null
    })
    wx.request({
      url: "https://qyapi.ipaybuy.cn/api/video",
      method: "POST",
      header: {
        "Content-Type": "application/json"
      },
      data: {
        appId: "116740",
        appKey: "1a4f8drm5o0diutfrt90bd63m0a0c7lr",
        url: this.data.linkInput
      },
      success: (res) => {
        const body = res.data || {}
        if (body.code === 200 && body.data) {
          wx.showToast({
            title: "解析成功",
            icon: "success"
          })
          this.setData({
            showParseResult: true,
            parseResult: {
              videoUrl: body.data.video_url || "",
              title: body.data.title || ""
            }
          })
          return
        }
        wx.showToast({
          title: body.msg || "解析失败",
          icon: "none"
        })
      },
      fail: () => {
        wx.showToast({
          title: "网络请求失败",
          icon: "none"
        })
      },
      complete: () => {
        this.setData({ isProcessing: false })
      }
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

  saveVideo() {
    const videoUrl = this.data.parseResult?.videoUrl
    if (!videoUrl || this.data.isSavingVideo) return

    const doSave = () => {
      this.setData({
        isSavingVideo: true,
        showDownloadProgress: true,
        downloadProgress: 0,
        downloadPhase: "downloading"
      })
      console.log('1111',videoUrl)
      const downloadTask = wx.downloadFile({
        
        url: videoUrl,
        success: (res) => {
          console.log(res)
          if (res.statusCode !== 200) {
            wx.showToast({ title: "下载失败", icon: "none" })
            this.resetDownloadProgress()
            return
          }
          this.setData({
            downloadProgress: 100,
            downloadPhase: "saving"
          })
          wx.saveVideoToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({
                title: "已保存到相册",
                icon: "success"
              })
              setTimeout(() => this.resetDownloadProgress(), 400)
            },
            fail: (err) => {
              const denied = err.errMsg && err.errMsg.includes("auth deny")
              wx.showToast({
                title: denied ? "请授权相册权限" : "保存失败",
                icon: "none"
              })
              this.resetDownloadProgress()
            }
          })
        },
        fail: () => {
          wx.showToast({ title: "下载失败", icon: "none" })
          this.resetDownloadProgress()
        }
      })

      if (downloadTask && downloadTask.onProgressUpdate) {
        downloadTask.onProgressUpdate(({ progress = 0 }) => {
          this.setData({
            downloadProgress: Math.min(Math.round(progress), 99)
          })
        })
      }
    }

    wx.getSetting({
      success: ({ authSetting }) => {
        if (authSetting["scope.writePhotosAlbum"]) {
          doSave()
          return
        }
        wx.authorize({
          scope: "scope.writePhotosAlbum",
          success: doSave,
          fail: () => {
            wx.showModal({
              title: "需要相册权限",
              content: "请在设置中开启保存到相册权限",
              confirmText: "去设置",
              success: (modalRes) => {
                if (modalRes.confirm) wx.openSetting()
              }
            })
          }
        })
      }
    })
  },

  chooseFile() {
    const isImage = this.data.activeMode === "image"
    wx.chooseMedia({
      count: 1,
      mediaType: [isImage ? "image" : "video"],
      sourceType: ["album", "camera"],
      success: () => {
        wx.showToast({
          title: "已选择文件",
          icon: "success"
        })
      }
    })
  }
})
