const media = require("../../utils/media")
const { encodeGif } = require("../../utils/gif")

const MAX_GIF_FRAMES = 12
const MAX_GIF_DURATION = 3

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
    progressLabel: ""
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
    if (!wx.createVideoDecoder) {
      wx.showModal({
        title: "版本过低",
        content: "视频转 GIF 需要较新的微信版本，请升级后重试",
        showCancel: false
      })
      return
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ["video"],
      sourceType: ["album"],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        this.convertVideoToGif(file.tempFilePath, file.duration || MAX_GIF_DURATION)
      }
    })
  },

  async convertVideoToGif(videoPath, durationSec) {
    this.setData({
      isConverting: true,
      showProgress: true,
      progress: 5,
      progressLabel: "正在解析视频帧"
    })

    try {
      const frames = await this.extractVideoFrames(
        videoPath,
        Math.min(durationSec, MAX_GIF_DURATION)
      )
      if (!frames.length) throw new Error("no frames")
      this.setData({ progress: 75, progressLabel: "正在生成 GIF" })
      const width = frames[0].width
      const height = frames[0].height
      const rgbaFrames = frames.map((item) => item.data)
      const buffer = encodeGif(rgbaFrames, width, height, 8)
      const filePath = `${wx.env.USER_DATA_PATH}/converted_${Date.now()}.gif`
      await this.writeBufferFile(filePath, buffer)
      this.setData({ gifPreviewPath: filePath, progress: 92 })
      media.withPhotosAlbumAuth(() => {
        media
          .saveImageFile(filePath)
          .then(() => {
            wx.showToast({ title: "GIF 已保存到相册", icon: "success" })
          })
          .catch(() => {
            wx.showToast({ title: "保存失败", icon: "none" })
          })
          .finally(() => this.resetProgress())
      })
    } catch (err) {
      wx.showToast({ title: "转换失败，请换短视频重试", icon: "none" })
      this.resetProgress()
    }
  },

  writeBufferFile(filePath, buffer) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().writeFile({
        filePath,
        data: buffer,
        success: resolve,
        fail: reject
      })
    })
  },

  extractVideoFrames(videoPath, durationSec) {
    return new Promise((resolve, reject) => {
      const decoder = wx.createVideoDecoder()
      const frames = []
      const frameCount = Math.min(
        MAX_GIF_FRAMES,
        Math.max(4, Math.round(durationSec * 4))
      )
      const interval = (durationSec * 1000) / frameCount
      let index = 0

      const captureNext = () => {
        if (index >= frameCount) {
          decoder.stop()
          if (!frames.length) reject(new Error("empty"))
          else resolve(frames)
          return
        }
        decoder.seek(index * interval)
        setTimeout(() => {
          decoder.getFrameData({
            success: (frame) => {
              if (frame && frame.data) {
                frames.push({
                  width: frame.width,
                  height: frame.height,
                  data: new Uint8Array(frame.data)
                })
                this.setData({
                  progress: Math.min(10 + Math.round((index / frameCount) * 60), 70)
                })
              }
              index += 1
              captureNext()
            },
            fail: () => {
              index += 1
              captureNext()
            }
          })
        }, 150)
      }

      decoder.on("start", () => captureNext())
      decoder.on("error", reject)
      decoder.start({ source: videoPath, mode: 0 })
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
