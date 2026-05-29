function encodeGif(frames, width, height, delayCs = 8) {
  if (!frames.length) throw new Error("no frames")

  const palette = buildPalette(frames, width, height)
  const paletteRgb = palette.map((idx) => [
    (idx >> 16) & 255,
    (idx >> 8) & 255,
    idx & 255
  ])

  const parts = []
  parts.push(bytes("GIF89a"))
  parts.push(u16le(width))
  parts.push(u16le(height))
  parts.push(byte(0xf7))
  parts.push(byte(0x00))
  parts.push(byte(0x00))
  parts.push(paletteBytes(paletteRgb))
  parts.push(byte(0x21))
  parts.push(byte(0xff))
  parts.push(byte(0x0b))
  parts.push(bytes("NETSCAPE2.0"))
  parts.push(byte(0x03))
  parts.push(byte(0x01))
  parts.push(byte(0x00))
  parts.push(byte(0x00))

  frames.forEach((frame) => {
    const indices = mapFrame(frame, width, height, palette)
    parts.push(byte(0x21))
    parts.push(byte(0xf9))
    parts.push(byte(0x04))
    parts.push(byte(0x00))
    parts.push(byte(delayCs & 0xff))
    parts.push(byte((delayCs >> 8) & 0xff))
    parts.push(byte(0x00))
    parts.push(byte(0x00))
    parts.push(byte(0x2c))
    parts.push(u16le(0))
    parts.push(u16le(0))
    parts.push(u16le(width))
    parts.push(u16le(height))
    parts.push(byte(0x00))
    parts.push(lzwEncode(indices, 8))
    parts.push(byte(0x00))
  })

  parts.push(byte(0x3b))
  return concat(parts)
}

function buildPalette(frames, width, height) {
  const map = new Map()
  const step = Math.max(1, Math.floor((width * height) / 1200))
  frames.forEach((frame) => {
    for (let i = 0; i < frame.length; i += step * 4) {
      const r = frame[i]
      const g = frame[i + 1]
      const b = frame[i + 2]
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
      map.set(key, (r << 16) | (g << 8) | b)
    }
  })
  const colors = Array.from(map.values()).slice(0, 255)
  while (colors.length < 256) colors.push(0)
  return colors
}

function mapFrame(frame, width, height, palette) {
  const indices = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = frame[i]
      const g = frame[i + 1]
      const b = frame[i + 2]
      let best = 0
      let bestDist = Infinity
      for (let p = 0; p < palette.length; p++) {
        const pr = (palette[p] >> 16) & 255
        const pg = (palette[p] >> 8) & 255
        const pb = palette[p] & 255
        const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
        if (dist < bestDist) {
          bestDist = dist
          best = p
        }
      }
      indices[y * width + x] = best
    }
  }
  return indices
}

function lzwEncode(indices, minCodeSize) {
  const clear = 1 << minCodeSize
  const eoi = clear + 1
  let codeSize = minCodeSize + 1
  let nextCode = eoi + 1
  const dict = new Map()
  const output = []
  let bitBuffer = 0
  let bitCount = 0

  const emit = (code) => {
    bitBuffer |= code << bitCount
    bitCount += codeSize
    while (bitCount >= 8) {
      output.push(bitBuffer & 0xff)
      bitBuffer >>= 8
      bitCount -= 8
    }
  }

  emit(clear)
  let current = String(indices[0])
  for (let i = 1; i < indices.length; i++) {
    const next = String(indices[i])
    const combined = current + "," + next
    if (dict.has(combined)) {
      current = combined
      continue
    }
    emit(dict.has(current) ? dict.get(current) : parseInt(current.split(",")[0], 10))
    dict.set(combined, nextCode++)
    current = next
    if (nextCode === 1 << codeSize && codeSize < 12) codeSize++
  }
  emit(dict.has(current) ? dict.get(current) : parseInt(current.split(",")[0], 10))
  emit(eoi)
  if (bitCount > 0) output.push(bitBuffer & 0xff)

  const data = [byte(minCodeSize)]
  let block = []
  output.forEach((value) => {
    block.push(value)
    if (block.length === 255) {
      data.push(byte(255))
      data.push(...block.map(byte))
      block = []
    }
  })
  if (block.length) {
    data.push(byte(block.length))
    data.push(...block.map(byte))
  }
  return concat(data)
}

function bytes(str) {
  return Array.from(str).map((ch) => byte(ch.charCodeAt(0)))
}

function byte(n) {
  return new Uint8Array([n & 0xff])
}

function u16le(n) {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff])
}

function paletteBytes(rgbList) {
  const out = []
  rgbList.forEach(([r, g, b]) => {
    out.push(byte(r), byte(g), byte(b))
  })
  return concat(out)
}

function concat(chunks) {
  let total = 0
  chunks.forEach((chunk) => {
    total += chunk.length
  })
  const out = new Uint8Array(total)
  let offset = 0
  chunks.forEach((chunk) => {
    out.set(chunk, offset)
    offset += chunk.length
  })
  return out.buffer
}

module.exports = { encodeGif }
