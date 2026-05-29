function withPhotosAlbumAuth(callback) {
  wx.getSetting({
    success: ({ authSetting }) => {
      if (authSetting["scope.writePhotosAlbum"]) {
        callback()
        return
      }
      wx.authorize({
        scope: "scope.writePhotosAlbum",
        success: callback,
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
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) resolve(res.tempFilePath)
        else reject(new Error("download failed"))
      },
      fail: reject
    })
  })
}

function saveImageFile(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: reject
    })
  })
}

function saveVideoFile(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveVideoToPhotosAlbum({
      filePath,
      success: resolve,
      fail: reject
    })
  })
}

function saveVideoToAlbum(videoUrl, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const task = wx.downloadFile({
      url: videoUrl,
      success: async (res) => {
        if (res.statusCode !== 200) {
          reject(new Error("download failed"))
          return
        }
        try {
          await saveVideoFile(res.tempFilePath)
          resolve()
        } catch (err) {
          reject(err)
        }
      },
      fail: reject
    })
    if (task && task.onProgressUpdate && onProgress) {
      task.onProgressUpdate(({ progress = 0 }) => onProgress(Math.min(Math.round(progress), 99)))
    }
  })
}

function saveImagesToAlbum(images, { onProgress } = {}) {
  const total = images.length
  let completed = 0

  const run = (index) => {
    if (index >= total) return Promise.resolve()
    const imageUrl = images[index].url
    return new Promise((resolve, reject) => {
      const task = wx.downloadFile({
        url: imageUrl,
        success: async (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`download ${index + 1} failed`))
            return
          }
          try {
            await saveImageFile(res.tempFilePath)
            completed += 1
            if (onProgress) onProgress(Math.round((completed / total) * 100))
            await run(index + 1)
            resolve()
          } catch (err) {
            reject(err)
          }
        },
        fail: reject
      })
      if (task && task.onProgressUpdate && onProgress) {
        task.onProgressUpdate(({ progress = 0 }) => {
          const overall = Math.min(
            Math.round(((index + progress / 100) / total) * 100),
            99
          )
          onProgress(overall)
        })
      }
    })
  }

  return run(0)
}

function saveParseResult(record, { onProgress } = {}) {
  if (record.videoUrl) {
    return saveVideoToAlbum(record.videoUrl, { onProgress })
  }
  if (record.images && record.images.length) {
    return saveImagesToAlbum(record.images, { onProgress })
  }
  return Promise.reject(new Error("empty record"))
}

function saveLivePhotoPair(image, { onProgress } = {}) {
  const steps = image.livePhotoUrl ? 2 : 1
  let step = 0

  const tick = (p) => {
    if (onProgress) onProgress(Math.min(Math.round((step / steps) * 100 + p / steps), 99))
  }

  return downloadFile(image.url)
    .then((coverPath) => {
      tick(40)
      return saveImageFile(coverPath)
    })
    .then(() => {
      step = 1
      if (!image.livePhotoUrl) return
      return downloadFile(image.livePhotoUrl).then((motionPath) => {
        tick(80)
        return saveVideoFile(motionPath)
      })
    })
}

function saveAllLivePhotos(images, { onProgress } = {}) {
  const list = (images || []).filter((item) => item.livePhotoUrl)
  if (!list.length) return Promise.reject(new Error("no live photo"))

  const run = (index) => {
    if (index >= list.length) return Promise.resolve()
    return saveLivePhotoPair(list[index]).then(() => run(index + 1))
  }

  return run(0)
}

module.exports = {
  withPhotosAlbumAuth,
  downloadFile,
  saveImageFile,
  saveVideoFile,
  saveVideoToAlbum,
  saveImagesToAlbum,
  saveParseResult,
  saveLivePhotoPair,
  saveAllLivePhotos
}
