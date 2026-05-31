const entitlement = require("./entitlement")
const rewardedAd = require("./rewarded-ad")

function requestUnlock(page, onGranted) {
  return entitlement.refreshEntitlement().then(() => {
    if (entitlement.canUseRemoveWatermark()) {
      if (typeof onGranted === "function") onGranted()
      return true
    }
    page._unlockCallback = onGranted
    page.setData({ showUnlockModal: true })
    return false
  })
}

function closeUnlockModal(page) {
  page._unlockCallback = null
  page.setData({ showUnlockModal: false })
}

function onWatchAdUnlock(page) {
  if (page.data.adUnlockLoading) return
  page.setData({ adUnlockLoading: true })
  rewardedAd
    .showRewardedVideoAd()
    .then(() => entitlement.grantDailyUnlock())
    .then(() => {
      page.setData({ showUnlockModal: false, adUnlockLoading: false })
      wx.showToast({ title: "今日已解锁", icon: "success" })
      const cb = page._unlockCallback
      page._unlockCallback = null
      if (typeof cb === "function") cb()
    })
    .catch((err) => {
      page.setData({ adUnlockLoading: false })
      wx.showToast({
        title: (err && err.message) || "广告未看完",
        icon: "none"
      })
    })
}

function onOpenVipModal(page) {
  page.setData({ showUnlockModal: false, showVipContactModal: true })
}

function onCloseVipContactModal(page) {
  page.setData({ showVipContactModal: false })
}

module.exports = {
  requestUnlock,
  closeUnlockModal,
  onWatchAdUnlock,
  onOpenVipModal,
  onCloseVipContactModal
}
