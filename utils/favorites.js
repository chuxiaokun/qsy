const auth = require("./auth")
const history = require("./history")
const mediaProxy = require("./mediaProxy")

const STORAGE_KEY = "mp_favorites"
const MAX_FAVORITES = 200

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

function normalizeFavorite(raw) {
  if (!raw) return null
  const createdAt =
    raw.createdAtMs || (raw.createdAt ? new Date(raw.createdAt).getTime() : Date.now())
  const item = {
    id: String(raw.id || `${Date.now()}`),
    createdAt,
    sourceUrl: raw.sourceUrl || raw.source_url || "",
    title: raw.title || "",
    videoUrl: raw.videoUrl || raw.video_url || "",
    images: (raw.images || []).map((it) => ({
      url: it.url || "",
      livePhotoUrl: it.livePhotoUrl || it.live_photo_url || ""
    })),
    platform: raw.platform || ""
  }
  return {
    ...item,
    timeLabel: raw.timeLabel || history.formatTimeLabel(createdAt),
    typeLabel: raw.typeLabel || history.getTypeLabel(item),
    thumbUrl:
      raw.thumbUrl != null
        ? raw.thumbUrl
        : item.videoUrl
          ? ""
          : (item.images[0] && item.images[0].url) || ""
  }
}

function existsLocal(sourceUrl) {
  const url = String(sourceUrl || "").trim()
  if (!url) return false
  return getLocalList().some((it) => String(it.sourceUrl || it.source_url || "").trim() === url)
}

async function addFavorite(payload) {
  const sourceUrl = String(payload.sourceUrl || payload.source_url || "").trim()
  if (!sourceUrl) throw new Error("缺少来源链接")

  if (canUseApi()) {
    try {
      const body = await auth.requestApi(
        "/api/user/favorites",
        {
          sourceUrl,
          title: payload.title || "",
          videoUrl: payload.videoUrl || "",
          images: (payload.images || []).map((it) => ({
            url: it.url || "",
            livePhotoUrl: it.livePhotoUrl || ""
          })),
          platform: payload.platform || ""
        },
        "POST"
      )
      if (body.code === 200 && body.data && body.data.favorite) {
        const favorite = normalizeFavorite(body.data.favorite)
        const list = getLocalList().filter((it) => it.sourceUrl !== favorite.sourceUrl)
        list.unshift(favorite)
        if (list.length > MAX_FAVORITES) list.length = MAX_FAVORITES
        saveLocalList(list)
        return favorite
      }
    } catch (err) {
      console.warn("[favorites] addFavorite api failed", err)
    }
  }

  const favorite = normalizeFavorite({
    id: `${Date.now()}`,
    createdAtMs: Date.now(),
    sourceUrl,
    title: payload.title || "",
    videoUrl: payload.videoUrl || "",
    images: payload.images || [],
    platform: payload.platform || ""
  })
  const list = getLocalList().filter((it) => it.sourceUrl !== sourceUrl)
  list.unshift(favorite)
  if (list.length > MAX_FAVORITES) list.length = MAX_FAVORITES
  saveLocalList(list)
  return favorite
}

async function removeFavorite(item) {
  const id = item && item.id ? String(item.id) : ""
  const sourceUrl = item && item.sourceUrl ? String(item.sourceUrl) : ""

  if (canUseApi() && id && /^\d+$/.test(id)) {
    try {
      await auth.requestApi(`/api/user/favorites/${id}`, {}, "DELETE")
    } catch (err) {
      console.warn("[favorites] removeFavorite api failed", err)
    }
  }

  const list = getLocalList().filter((it) => {
    if (sourceUrl) return it.sourceUrl !== sourceUrl
    return it.id !== id
  })
  saveLocalList(list)
  return list
}

async function loadList() {
  if (canUseApi()) {
    try {
      const body = await auth.requestApi("/api/user/favorites", { limit: 100 }, "GET")
      if (body.code === 200 && body.data) {
        const favorites = (body.data.favorites || []).map(normalizeFavorite).filter(Boolean)
        saveLocalList(favorites)
        return favorites
      }
    } catch (err) {
      console.warn("[favorites] loadList api failed", err)
    }
  }
  return getLocalList()
}

async function getCount() {
  const list = await loadList().catch(() => getLocalList())
  return list.length
}

function getListForDisplay(list) {
  const source = list || getLocalList()
  return source.map((it) => mediaProxy.withListItemPreviewUrls(normalizeFavorite(it)))
}

module.exports = {
  getLocalList,
  loadList,
  getCount,
  existsLocal,
  addFavorite,
  removeFavorite,
  getListForDisplay
}

