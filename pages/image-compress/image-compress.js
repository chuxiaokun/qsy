const media = require("../../utils/media")

const COMPRESS_MAX_SIDE_OPTIONS = [720, 1080, 1440, 1920]
const DEFAULT_COMPRESS_SIDE_INDEX = 1
const DEFAULT_COMPRESS_QUALITY = 80

Page({
  data: {
    statusBarHeight: 0,
    compressPreviewPath: "",
    canvasWidth: 320,
    canvasHeight: 320,
    isConverting: false,
    showProgress: false,
    progress: 0,
    progressLabel: "",
    compressQuality: DEFAULT_COMPRESS_QUALITY,
    compressMaxSideOptions: COMPRESS_MAX_SIDE_OPTIONS,
    compressMaxSideIndex: DEFAULT_COMPRESS_SIDE_INDEX
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
  },

  goBack() {
    wx.navigateBack()
  },

  onCompressQualityChange(event) {
    const value = Number(event.detail.value) || DEFAULT_COMPRESS_QUALITY
    this.setData({
      compressQuality: Math.max(30, Math.min(95, Math.round(value)))
    })
  },

  onCompressMaxSideChange(event) {
    const index = Number(event.detail.value) || 0
    const maxIndex = this.data.compressMaxSideOptions.length - 1
    this.setData({
      compressMaxSideIndex: Math.max(0, Math.min(maxIndex, index))
    })
  },

  chooseCompressImage() {
    if (this.data.isConverting) return
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        this.compressImage(file.tempFilePath)
      }
    })
  },

  compressImage(filePath) {
    this.setData({
      isConverting: true,
      showProgress: true,
      progress: 10,
      progressLabel: "正在读取图片"
    })

    wx.getImageInfo({
      src: filePath,
      success: (info) => {
        const maxSide = this.data.compressMaxSideOptions[this.data.compressMaxSideIndex]
        const target = this.fitSize(info.width, info.height, maxSide)
        this.setData({ canvasWidth: target.width, canvasHeight: target.height, progress: 35 })
        this.drawImageToCompressedJpg(
          filePath,
          target.width,
          target.height,
          this.data.compressQuality / 100
        )
      },
      fail: () => {
        wx.showToast({ title: "无法读取图片", icon: "none" })
        this.resetProgress()
      }
    })
  },

  fitSize(width, height, maxSide) {
    const w = Number(width) || 0
    const h = Number(height) || 0
    const m = Number(maxSide) || 0
    if (!w || !h || !m) return { width: w, height: h }
    if (w <= m && h <= m) return { width: w, height: h }
    const ratio = Math.min(m / w, m / h)
    return { width: Math.max(1, Math.round(w * ratio)), height: Math.max(1, Math.round(h * ratio)) }
  },

  drawImageToCompressedJpg(filePath, width, height, quality) {
    const query = wx.createSelectorQuery()
    query
      .select("#compressCanvas")
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0] && res[0].node
        if (!canvas) {
          wx.showToast({ title: "画布初始化失败", icon: "none" })
          this.resetProgress()
          return
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        const image = canvas.createImage()
        image.onload = () => {
          ctx.drawImage(image, 0, 0, width, height)
          this.setData({ progress: 70, progressLabel: "正在导出 JPG" })
          wx.canvasToTempFilePath({
            canvas,
            fileType: "jpg",
            quality: Math.max(0.3, Math.min(0.95, Number(quality) || 0.8)),
            success: (out) => {
              this.setData({
                compressPreviewPath: out.tempFilePath,
                progress: 100,
                progressLabel: "JPG 已生成"
              })
              wx.showToast({ title: "已生成 JPG，点击下方按钮保存", icon: "none" })
              this.resetProgress()
            },
            fail: () => {
              wx.showToast({ title: "导出失败", icon: "none" })
              this.resetProgress()
            }
          })
        }
        image.onerror = () => {
          wx.showToast({ title: "图片绘制失败", icon: "none" })
          this.resetProgress()
        }
        image.src = filePath
      })
  },

  saveCompressedToAlbum() {
    const filePath = this.data.compressPreviewPath
    if (!filePath) return
    if (this.data.isConverting) return
    this.setData({
      isConverting: true,
      showProgress: true,
      progress: 10,
      progressLabel: "正在保存到相册"
    })
    media.withPhotosAlbumAuth(() => {
      media
        .saveImageFile(filePath)
        .then(() => {
          wx.showToast({ title: "已保存到相册", icon: "success" })
        })
        .catch(() => {
          wx.showToast({ title: "保存失败", icon: "none" })
        })
        .finally(() => this.resetProgress())
    })
  },

  resetProgress() {
    this.setData({
      isConverting: false,
      showProgress: false,
      progress: 0,
      progressLabel: ""
    })
  }
})

