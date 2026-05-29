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
    activeTab: "remove",
    activeMode: "link",
    linkInput: "",
    isProcessing: false,
    platforms,
    products,
    menuItems,
    settingsItems
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

  handleProcess() {
    if (!this.data.linkInput.trim() || this.data.isProcessing) return
    this.setData({ isProcessing: true })
    setTimeout(() => {
      this.setData({ isProcessing: false })
      wx.showToast({
        title: "解析完成",
        icon: "success"
      })
    }, 1600)
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
