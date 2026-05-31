const auth = require("./auth")

const STORAGE_KEY = "parse_history"
const MAX_RECORDS = 50

function canUseApi() {
  const user = auth.getUser()
  return auth.apiReady() && !!auth.getToken() && user && !user.isLocal
}

function getLocalList() {
  try {
    return wx.getStorageSync(STORAGE_KEY) || []
  } catch {
    return []
  }
}

function saveLocalList(list) {
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

function normalizeRecord(raw) {
  if (!raw) return null
  const createdAt = raw.createdAtMs || (raw.createdAt ? new Date(raw.createdAt).getTime() : Date.now())
  const record = {
    id: String(raw.id || `${Date.now()}`),
    createdAt,
    sourceUrl: raw.sourceUrl || "",
    title: raw.title || "",
    videoUrl: raw.videoUrl || "",
    images: (raw.images || []).map((item) => ({
      url: item.url || "",
      livePhotoUrl: item.livePhotoUrl || item.live_photo_url || ""
    })),
    platform: raw.platform || "",
    status: raw.status || "success"
  }
  return {
    ...record,
    timeLabel: raw.timeLabel || formatTimeLabel(createdAt),
    typeLabel: raw.typeLabel || getTypeLabel(record),
    hasLive: raw.hasLive != null ? !!raw.hasLive : hasLivePhoto(record),
    thumbUrl:
      raw.thumbUrl != null
        ? raw.thumbUrl
        : record.videoUrl
          ? ""
          : (record.images[0] && record.images[0].url) || ""
  }
}

function addLocalRecord({ sourceUrl, title, videoUrl, images }) {
  const list = getLocalList()
  const item = normalizeRecord({
    id: `${Date.now()}`,
    createdAtMs: Date.now(),
    sourceUrl: sourceUrl || "",
    title: title || "",
    videoUrl: videoUrl || "",
    images: images || []
  })
  list.unshift(item)
  if (list.length > MAX_RECORDS) {
    list.length = MAX_RECORDS
  }
  saveLocalList(list)
  return item
}

async function addRecord({ sourceUrl, title, videoUrl, images }) {
  if (canUseApi()) {
    try {
      const body = await auth.requestApi(
        "/api/user/parse-records",
        {
          sourceUrl,
          title,
          videoUrl: videoUrl || "",
          video_url: videoUrl || "",
          images: (images || []).map((item) => ({
            url: item.url || "",
            livePhotoUrl: item.livePhotoUrl || ""
          }))
        },
        "POST"
      )
      if (body.code === 200 && body.data && body.data.record) {
        const record = normalizeRecord(body.data.record)
        const list = getLocalList().filter((item) => item.id !== record.id)
        list.unshift(record)
        if (list.length > MAX_RECORDS) list.length = MAX_RECORDS
        saveLocalList(list)
        return record
      }
    } catch (err) {
      console.warn("[history] addRecord api failed", err)
    }
  }
  return addLocalRecord({ sourceUrl, title, videoUrl, images })
}

async function loadList() {
  if (canUseApi()) {
    try {
      const body = await auth.requestApi("/api/user/parse-records", { limit: MAX_RECORDS }, "GET")
      if (body.code === 200 && body.data) {
        const records = (body.data.records || []).map(normalizeRecord)
        saveLocalList(records)
        return records
      }
    } catch (err) {
      console.warn("[history] loadList api failed", err)
    }
  }
  return getLocalList()
}

function getList() {
  return getLocalList()
}

async function getCount() {
  if (canUseApi()) {
    try {
      const body = await auth.requestApi("/api/user/parse-records/count", {}, "GET")
      if (body.code === 200 && body.data) {
        return Number(body.data.count) || 0
      }
    } catch (err) {
      console.warn("[history] getCount api failed", err)
    }
  }
  return getLocalList().length
}

async function getById(id) {
  if (canUseApi()) {
    try {
      const body = await auth.requestApi(`/api/user/parse-records/${id}`, {}, "GET")
      if (body.code === 200 && body.data && body.data.record) {
        return normalizeRecord(body.data.record)
      }
    } catch (err) {
      console.warn("[history] getById api failed", err)
    }
  }
  return getLocalList().find((item) => item.id === id) || null
}

async function removeRecord(id) {
  if (canUseApi()) {
    try {
      await auth.requestApi(`/api/user/parse-records/${id}`, {}, "DELETE")
    } catch (err) {
      console.warn("[history] removeRecord api failed", err)
    }
  }
  const list = getLocalList().filter((item) => item.id !== id)
  saveLocalList(list)
  return list
}

async function clearAll() {
  if (canUseApi()) {
    try {
      await auth.requestApi("/api/user/parse-records", {}, "DELETE")
    } catch (err) {
      console.warn("[history] clearAll api failed", err)
    }
  }
  saveLocalList([])
}

function getListForDisplay(list) {
  const source = list || getLocalList()
  return source.map((item) => normalizeRecord(item))
}

function getLivePhotoItems(list) {
  const source = list || getLocalList()
  const items = []
  source.forEach((record) => {
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
  loadList,
  getCount,
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
