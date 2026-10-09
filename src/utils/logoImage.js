// Prepares an uploaded logo for the Company Profile: PNG or JPG only, resized to fit 600 x 600 and re-encoded in
// the browser so it stays within the API's 200 KB limit. Re-encoding also drops anything hidden in the file.
export const MAX_LOGO_BYTES = 204800
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024
const MAX_SIDE = 600

// Bytes in a base64 data URL
export const dataUrlBytes = (dataUrl) => {
  const b64 = String(dataUrl).split(',')[1] || ''
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.floor((b64.length * 3) / 4) - pad
}

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The logo file could not be read.')) }
    img.src = url
  })

const encode = (img, side, type, quality) => {
  const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (type === 'image/jpeg') {
    ctx.fillStyle = '#ffffff' // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL(type, quality)
}

// Resolves with a data URL of at most 200 KB, or rejects with a message for the user
export const prepareLogo = async (file) => {
  if (!file) throw new Error('Choose a logo file.')
  if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('The logo must be a PNG or JPG image.')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('The logo file must be 5 MB or smaller.')
  const img = await loadImage(file)

  // PNG keeps transparency; fall back to JPEG at lower quality and size until it fits
  const attempts = [
    [MAX_SIDE, file.type, 0.92],
    [MAX_SIDE, 'image/jpeg', 0.85],
    [400, 'image/jpeg', 0.8],
    [300, 'image/jpeg', 0.7],
  ]
  for (const [side, type, quality] of attempts) {
    const url = encode(img, side, type, quality)
    if (dataUrlBytes(url) <= MAX_LOGO_BYTES) return url
  }
  throw new Error('The logo is too detailed to fit in 200 KB. Please use a simpler or smaller image.')
}
