const { REWARDED_VIDEO_AD_UNIT } = require("./config")

let videoAd = null
let pendingResolve = null
let pendingReject = null

function getAd() {
  if (!wx.createRewardedVideoAd) return null
  if (!videoAd) {
    videoAd = wx.createRewardedVideoAd({ adUnitId: REWARDED_VIDEO_AD_UNIT })
    videoAd.onLoad(() => {})
    videoAd.onError((err) => {
      console.error("激励视频广告加载失败", err)
      if (pendingReject) {
        pendingReject(err)
        pendingResolve = null
        pendingReject = null
      }
    })
    videoAd.onClose((res) => {
      if (!pendingResolve && !pendingReject) return
      if (res && res.isEnded) {
        pendingResolve(true)
      } else if (pendingReject) {
        pendingReject(new Error("请看完广告后再解锁"))
      }
      pendingResolve = null
      pendingReject = null
    })
  }
  return videoAd
}

function showRewardedVideoAd() {
  return new Promise((resolve, reject) => {
    const ad = getAd()
    if (!ad) {
      reject(new Error("当前版本不支持激励广告"))
      return
    }
    pendingResolve = resolve
    pendingReject = reject
    ad.show().catch(() => {
      ad.load()
        .then(() => ad.show())
        .catch((err) => {
          console.error("激励视频广告显示失败", err)
          pendingResolve = null
          pendingReject = null
          reject(err)
        })
    })
  })
}

module.exports = { showRewardedVideoAd }
