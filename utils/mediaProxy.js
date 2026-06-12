const { API_BASE } = require("./config")

function apiBase() {
  return String(API_BASE || "").trim().replace(/\/$/, "")
}

function utf8ToBase64Url(str) {
  const utf8 = unescape(encodeURIComponent(str))
  const bytes = new Uint8Array(utf8.length)
  for (let i = 0; i < utf8.length; i++) {
    bytes[i] = utf8.charCodeAt(i)
  }
  return wx
    .arrayBufferToBase64(bytes.buffer)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function isOwnApiUrl(url) {
  const base = apiBase()
  if (!base || !url) return false
  const normalized = String(url).trim()
  return normalized === base || normalized.startsWith(`${base}/`)
}

const HTTPS_PREFERRED_HOSTS = [
  /(?:^|\.)xhscdn\.com$/i,
  /(?:^|\.)douyinvod\.com$/i,
  /(?:^|\.)douyinpic\.com$/i,
  /(?:^|\.)iesdouyin\.com$/i,
  /(?:^|\.)kwimgs\.com$/i,
  /(?:^|\.)hdslb\.com$/i
]

function normalizeSourceMediaUrl(raw) {
  const trimmed = String(raw || "").trim()
  if (!trimmed) return trimmed
  if (!/^https?:\/\//i.test(trimmed)) return trimmed
  const httpMatch = trimmed.match(/^(https?):\/\/([^/?#]+)(.*)$/i)
  if (!httpMatch || httpMatch[1].toLowerCase() !== "http") return trimmed
  const host = httpMatch[2].toLowerCase()
  if (!HTTPS_PREFERRED_HOSTS.some((re) => re.test(host))) return trimmed
  return `https://${httpMatch[2]}${httpMatch[3]}`
}

function resolveProxiedMediaUrl(originalUrl) {
  const url = normalizeSourceMediaUrl(originalUrl)
  if (!url || isOwnApiUrl(url)) return url
  const base = apiBase()
  if (!base) return url
  const u = utf8ToBase64Url(url)
  return `${base}/api/tools/media-download?u=${encodeURIComponent(u)}`
}

function withImagePreviewUrls(image) {
  if (!image) return image
  return {
    ...image,
    previewUrl: resolveProxiedMediaUrl(image.url || "")
  }
}

function withImagesPreviewUrls(images) {
  return (images || []).map(withImagePreviewUrls)
}

function withRecordPreviewUrls(record) {
  if (!record) return record
  return {
    ...record,
    previewVideoUrl: resolveProxiedMediaUrl(record.videoUrl || ""),
    images: withImagesPreviewUrls(record.images || [])
  }
}

function withListItemPreviewUrls(item) {
  if (!item) return item
  const thumb = item.thumbUrl || ""
  return {
    ...item,
    previewThumbUrl: thumb ? resolveProxiedMediaUrl(thumb) : ""
  }
}

function withLivePhotoItemPreviewUrls(item) {
  if (!item) return item
  return {
    ...item,
    previewUrl: resolveProxiedMediaUrl(item.url || "")
  }
}

module.exports = {
  resolveProxiedMediaUrl,
  withImagePreviewUrls,
  withImagesPreviewUrls,
  withRecordPreviewUrls,
  withListItemPreviewUrls,
  withLivePhotoItemPreviewUrls
}
