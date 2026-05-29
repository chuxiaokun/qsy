const STORAGE_KEY = "parse_history"
const MAX_RECORDS = 50

function getList() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || []
  } catch {
    return []
  }
}

function saveList(list) {
  wx.setStorageSync(STORAGE_KEY, list)
}

function formatTimeLabel(timestamp) {
  const date = new Date(timestamp)
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function getTypeLabel(record) {
  if (record.videoUrl) return "视频"
  if (record.images && record.images.length > 1) return `图集 ${record.images.length} 张`
  if (record.images && record.images.length) return "图片"
  return "链接"
}

function hasLivePhoto(record) {
  return (record.images || []).some((item) => item.livePhotoUrl)
}

function addRecord({ sourceUrl, title, videoUrl, images }) {
  const list = getList()
  const item = {
    id: `${Date.now()}`,
    createdAt: Date.now(),
    sourceUrl: sourceUrl || "",
    title: title || "",
    videoUrl: videoUrl || "",
    images: images || []
  }
  list.unshift(item)
  if (list.length > MAX_RECORDS) {
    list.length = MAX_RECORDS
  }
  saveList(list)
  return item
}

function getById(id) {
  return getList().find((item) => item.id === id) || null
}

function removeRecord(id) {
  const list = getList().filter((item) => item.id !== id)
  saveList(list)
  return list
}

function clearAll() {
  saveList([])
}

function getListForDisplay() {
  return getList().map((item) => ({
    ...item,
    timeLabel: formatTimeLabel(item.createdAt),
    typeLabel: getTypeLabel(item),
    hasLive: hasLivePhoto(item),
    thumbUrl: item.videoUrl
      ? ""
      : (item.images && item.images[0] && item.images[0].url) || ""
  }))
}

function getLivePhotoItems() {
  const items = []
  getList().forEach((record) => {
    ;(record.images || []).forEach((image, index) => {
      if (image.livePhotoUrl) {
        items.push({
          id: `${record.id}_${index}`,
          recordId: record.id,
          title: record.title || `作品 ${index + 1}`,
          url: image.url,
          livePhotoUrl: image.livePhotoUrl,
          timeLabel: formatTimeLabel(record.createdAt)
        })
      }
    })
  })
  return items
}

module.exports = {
  getList,
  getListForDisplay,
  getLivePhotoItems,
  addRecord,
  getById,
  removeRecord,
  clearAll,
  formatTimeLabel,
  getTypeLabel,
  hasLivePhoto
}
