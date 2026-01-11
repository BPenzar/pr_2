const QR_LOGO_SRC = '/logo.png'
const LOGO_RENDER_SIZE_PX = 1024
const LOGO_SIZE_RATIO = 0.26
const LOGO_HALO_PAD_RATIO = 0.06
const LOGO_COMPOSITE_RATIO = LOGO_SIZE_RATIO * (1 + 2 * LOGO_HALO_PAD_RATIO)

export const QR_ERROR_CORRECTION_LEVEL = 'H'
export const QR_MARGIN = 2

type LogoCache = {
  dataUrl: string | null
  dataUrlPromise: Promise<string | null> | null
  image: HTMLImageElement | null
  imagePromise: Promise<HTMLImageElement | null> | null
}

const logoCache: LogoCache = {
  dataUrl: null,
  dataUrlPromise: null,
  image: null,
  imagePromise: null,
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })

const createCircularLogoDataUrl = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null

  const logoImage = await loadImage(QR_LOGO_SRC)
  const compositeSize = LOGO_RENDER_SIZE_PX
  const logoDiameter = compositeSize / (1 + 2 * LOGO_HALO_PAD_RATIO)
  const ringThickness = (compositeSize - logoDiameter) / 2

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  canvas.width = compositeSize
  canvas.height = compositeSize
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const center = compositeSize / 2
  const outerRadius = center
  const innerRadius = Math.max(1, outerRadius - ringThickness)

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(center, center, outerRadius, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.arc(center, center, innerRadius, 0, Math.PI * 2)
  ctx.clip()

  const innerDiameter = innerRadius * 2
  const scale = Math.max(innerDiameter / logoImage.width, innerDiameter / logoImage.height)
  const drawWidth = logoImage.width * scale
  const drawHeight = logoImage.height * scale
  ctx.drawImage(
    logoImage,
    center - drawWidth / 2,
    center - drawHeight / 2,
    drawWidth,
    drawHeight
  )
  ctx.restore()

  return canvas.toDataURL('image/png')
}

export const getQrLogoDataUrl = async (): Promise<string | null> => {
  if (logoCache.dataUrl) return logoCache.dataUrl
  if (logoCache.dataUrlPromise) return logoCache.dataUrlPromise

  logoCache.dataUrlPromise = createCircularLogoDataUrl()
    .then((dataUrl) => {
      logoCache.dataUrl = dataUrl
      return dataUrl
    })
    .finally(() => {
      logoCache.dataUrlPromise = null
    })

  return logoCache.dataUrlPromise
}

export const getQrLogoImage = async (): Promise<HTMLImageElement | null> => {
  if (logoCache.image) return logoCache.image
  if (logoCache.imagePromise) return logoCache.imagePromise

  logoCache.imagePromise = getQrLogoDataUrl()
    .then((dataUrl) => (dataUrl ? loadImage(dataUrl) : null))
    .then((image) => {
      logoCache.image = image
      return image
    })
    .finally(() => {
      logoCache.imagePromise = null
    })

  return logoCache.imagePromise
}

export const getQrLogoSizePx = (qrSizePx: number) =>
  Math.round(qrSizePx * LOGO_COMPOSITE_RATIO)

export const getQrLogoImageSettings = (qrSizePx: number, logoDataUrl: string) => {
  const logoSize = getQrLogoSizePx(qrSizePx)
  return {
    src: logoDataUrl,
    width: logoSize,
    height: logoSize,
    excavate: false,
  }
}

export const renderQrWithLogoDataUrl = async (
  qrDataUrl: string,
  sizePx: number
): Promise<string> => {
  if (typeof window === 'undefined') return qrDataUrl

  const logoImage = await getQrLogoImage()
  if (!logoImage) return qrDataUrl

  const qrImage = await loadImage(qrDataUrl)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return qrDataUrl

  canvas.width = sizePx
  canvas.height = sizePx
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(qrImage, 0, 0, sizePx, sizePx)

  const logoSize = getQrLogoSizePx(sizePx)
  const logoX = (sizePx - logoSize) / 2
  const logoY = (sizePx - logoSize) / 2
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)

  return canvas.toDataURL('image/png')
}
