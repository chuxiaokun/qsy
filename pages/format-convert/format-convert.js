const media = require("../../utils/media")
const { API_BASE } = require("../../utils/config")

const MAX_GIF_DURATION = 6
const MIN_GIF_DURATION = 1
const DEFAULT_GIF_DURATION = 3
const MIN_GIF_FPS = 4
const MAX_GIF_FPS = 12
const DEFAULT_GIF_FPS = 8
function apiBase() {
  return String(API_BASE || "").trim().replace(/\/$/, "")
}

Page({
  data: {
    statusBarHeight: 0,
    mode: "heic",
    previewPath: "",
    gifPreviewPath: "",
    canvasWidth: 320,
    canvasHeight: 320,
    isConverting: false,
    showProgress: false,
    progress: 0,
    progressLabel: "",
    selectedVideoDuration: 0,
    gifDuration: DEFAULT_GIF_DURATION,
    gifFps: DEFAULT_GIF_FPS
  },

  onLoad() {
    const { statusBarHeight = 0 } = wx.getWindowInfo()
    this.setData({ statusBarHeight })
  },

  goBack() {
    wx.navigateBack()
  },

  switchMode(event) {
    this.setData({ mode: event.currentTarget.dataset.mode })
  },

  onGifDurationChange(event) {
    const value = Number(event.detail.value) || DEFAULT_GIF_DURATION
    this.setData({
      gifDuration: Math.max(MIN_GIF_DURATION, Math.min(MAX_GIF_DURATION, value))
    })
  },

  onGifFpsChange(event) {
    const value = Number(event.detail.value) || DEFAULT_GIF_FPS
    this.setData({
      gifFps: Math.max(MIN_GIF_FPS, Math.min(MAX_GIF_FPS, value))
    })
  },

  chooseHeic() {
    if (this.data.isConverting) return
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        this.convertHeicToJpg(file.tempFilePath)
      }
    })
  },

  convertHeicToJpg(filePath) {
    this.setData({
      isConverting: true,
      showProgress: true,
      progress: 10,
      progressLabel: "正在读取图片"
    })

    wx.getImageInfo({
      src: filePath,
      success: (info) => {
        const maxSide = 1920
        let width = info.width
        let height = info.height
        if (width > maxSide || height > maxSide) {
          const ratio = Math.min(maxSide / width, maxSide / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        this.setData({ canvasWidth: width, canvasHeight: height, progress: 35 })
        this.drawImageToJpg(filePath, width, height)
      },
      fail: () => {
        wx.showToast({ title: "无法读取图片", icon: "none" })
        this.resetProgress()
      }
    })
  },

  drawImageToJpg(filePath, width, height) {
    const query = wx.createSelectorQuery()
    query
      .select("#convertCanvas")
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
            quality: 0.92,
            success: (out) => {
              this.setData({ previewPath: out.tempFilePath, progress: 90 })
              media.withPhotosAlbumAuth(() => {
                media
                  .saveImageFile(out.tempFilePath)
                  .then(() => {
                    wx.showToast({ title: "已保存 JPG 到相册", icon: "success" })
                  })
                  .catch(() => {
                    wx.showToast({ title: "保存失败", icon: "none" })
                  })
                  .finally(() => this.resetProgress())
              })
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

  chooseVideo() {
    if (this.data.isConverting) return
    if (!apiBase()) {
      wx.showToast({ title: "未配置 API_BASE", icon: "none" })
      return
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ["video"],
      sourceType: ["album"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        const rawDuration = Number(file.duration) || MAX_GIF_DURATION
        this.setData({
          selectedVideoDuration: rawDuration
        })
        this.convertVideoToGif(file.tempFilePath, rawDuration)
      }
    })
  },

  async convertVideoToGif(videoPath, durationSec) {
    this.setData({
      isConverting: true,
      showProgress: true,
      progress: 5,
      progressLabel: "正在上传视频"
    })

    try {
      const actualDuration = Math.max(MIN_GIF_DURATION, Number(durationSec) || MAX_GIF_DURATION)
      const plannedDuration = Math.min(this.data.gifDuration, actualDuration)
      const gifUrl = await this.uploadVideoAndConvert(videoPath, {
        durationSec: plannedDuration,
        fps: this.data.gifFps
      })
      this.setData({ progress: 78, progressLabel: "正在下载 GIF" })
      const filePath = await media.downloadFile(gifUrl)
      this.setData({ gifPreviewPath: filePath, progress: 100, progressLabel: "GIF 已生成" })
      wx.showToast({ title: "已生成 GIF，点击下方按钮保存", icon: "none" })
      this.resetProgress()
    } catch (err) {
      const message = err && err.message ? err.message : "转换失败，请稍后重试"
      wx.showToast({ title: message, icon: "none" })
      this.resetProgress()
    }
  },

  saveGifToAlbum() {
    const filePath = this.data.gifPreviewPath
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

  uploadVideoAndConvert(videoPath, options) {
    return new Promise((resolve, reject) => {
      const base = apiBase()
      const task = wx.uploadFile({
        url: `${base}/api/tools/video-to-gif`,
        filePath: videoPath,
        name: "video",
        timeout: 120000,
        formData: {
          durationSec: String(options.durationSec),
          fps: String(options.fps)
        },
        success: (res) => {
          let body = {}
          try {
            body = typeof res.data === "string" ? JSON.parse(res.data) : res.data || {}
          } catch (e) {
            reject(new Error("服务返回异常"))
            return
          }
          if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 200 && body.data && body.data.gifUrl) {
            resolve(body.data.gifUrl)
            return
          }
          reject(new Error(body.msg || `转换失败(${res.statusCode})`))
        },
        fail: (err) => {
          reject(new Error((err && err.errMsg) || "网络异常"))
        }
      })
      if (task && task.onProgressUpdate) {
        task.onProgressUpdate(({ progress = 0 }) => {
          this.setData({
            progress: Math.min(10 + Math.round(progress * 0.6), 70)
          })
        })
      }
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
