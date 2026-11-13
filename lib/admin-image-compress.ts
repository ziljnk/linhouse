/**
 * Browser-side resize/compress for admin uploads.
 * Size math and fallback decisions are pure so they can be unit tested
 * without a canvas. Encoding runs in the browser.
 */

export const ADMIN_UPLOAD_MAX_EDGE = 2400
export const ADMIN_UPLOAD_QUALITY = 0.85

const preparedFiles = new WeakSet<File>()

export type FittedSize = {
  width: number
  height: number
  /** 1 when the image is already within the long-edge cap. */
  scale: number
}

export function fittedSize(
  width: number,
  height: number,
  maxEdge = ADMIN_UPLOAD_MAX_EDGE
): FittedSize {
  const safeWidth = Math.max(0, Math.round(width))
  const safeHeight = Math.max(0, Math.round(height))
  const longEdge = Math.max(safeWidth, safeHeight)
  if (longEdge === 0 || longEdge <= maxEdge) {
    return { width: safeWidth, height: safeHeight, scale: 1 }
  }

  const scale = maxEdge / longEdge
  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
    scale,
  }
}

/**
 * Intermediate canvas sizes for a large downscale.
 * Halve until another half would pass the target, then finish at the target.
 * An image that is already small enough returns no steps.
 */
export function downscaleSteps(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
): Array<{ width: number; height: number }> {
  let width = Math.max(1, Math.round(sourceWidth))
  let height = Math.max(1, Math.round(sourceHeight))
  const sourceLong = Math.max(width, height)
  const targetLong = Math.max(1, Math.round(Math.max(targetWidth, targetHeight)))
  if (targetLong >= sourceLong) return []

  const steps: Array<{ width: number; height: number }> = []

  while (Math.max(width, height) / 2 > targetLong) {
    const nextWidth = Math.max(1, Math.round(width / 2))
    const nextHeight = Math.max(1, Math.round(height / 2))
    if (nextWidth === width && nextHeight === height) break
    width = nextWidth
    height = nextHeight
    steps.push({ width, height })
  }

  if (width !== targetWidth || height !== targetHeight) {
    steps.push({
      width: Math.max(1, Math.round(targetWidth)),
      height: Math.max(1, Math.round(targetHeight)),
    })
  }

  return steps
}

export type EncodeMime = "image/webp" | "image/jpeg" | "image/png"

/**
 * WebP keeps PNG alpha. When the browser cannot encode WebP, opaque images
 * fall back to JPEG and transparent images stay PNG so alpha is not flattened.
 */
export function selectEncodeMime(input: {
  webpSupported: boolean
  hasAlpha: boolean
}): EncodeMime {
  if (input.webpSupported) return "image/webp"
  if (input.hasAlpha) return "image/png"
  return "image/jpeg"
}

/**
 * Keep the original when recompressing made it larger and it is already
 * within the long-edge cap (and the optional byte cap).
 */
export function shouldKeepOriginalFile(input: {
  originalBytes: number
  compressedBytes: number
  originalLongEdge: number
  maxEdge?: number
  maxBytes?: number
}): boolean {
  if (input.compressedBytes <= 0) return true
  const maxEdge = input.maxEdge ?? ADMIN_UPLOAD_MAX_EDGE
  const withinEdge = input.originalLongEdge > 0 && input.originalLongEdge <= maxEdge
  const withinBytes = input.maxBytes == null || input.originalBytes <= input.maxBytes
  return withinEdge && withinBytes && input.compressedBytes > input.originalBytes
}

export function fileNameForMime(name: string, mime: string) {
  const base = name.replace(/\.[^.\\/]+$/, "").trim() || "image"
  const extension =
    mime === "image/webp" ? "webp" : mime === "image/png" ? "png" : "jpg"
  return `${base}.${extension}`
}

function canvasSupportsWebp(): Promise<boolean> {
  if (webpSupport != null) return Promise.resolve(webpSupport)
  if (!webpSupportPromise) {
    webpSupportPromise = new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      canvas.width = 1
      canvas.height = 1
      canvas.toBlob((blob) => {
        webpSupport = blob?.type === "image/webp"
        resolve(webpSupport)
      }, "image/webp", ADMIN_UPLOAD_QUALITY)
    })
  }
  return webpSupportPromise
}

let webpSupport: boolean | null = null
let webpSupportPromise: Promise<boolean> | null = null

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

function canvasHasAlpha(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return false
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) return true
  }
  return false
}

function renderFitted(bitmap: ImageBitmap, targetWidth: number, targetHeight: number) {
  const steps = downscaleSteps(bitmap.width, bitmap.height, targetWidth, targetHeight)
  const paints =
    steps.length > 0 ? steps : [{ width: targetWidth, height: targetHeight }]
  let source: CanvasImageSource = bitmap
  let sourceWidth = bitmap.width
  let sourceHeight = bitmap.height
  let canvas: HTMLCanvasElement | null = null

  for (const step of paints) {
    const next = document.createElement("canvas")
    next.width = step.width
    next.height = step.height
    const context = next.getContext("2d")
    if (!context) {
      throw new Error("Không tạo được canvas để nén ảnh.")
    }
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(
      source,
      0,
      0,
      sourceWidth,
      sourceHeight,
      0,
      0,
      step.width,
      step.height
    )
    source = next
    sourceWidth = step.width
    sourceHeight = step.height
    canvas = next
  }

  if (!canvas) {
    throw new Error("Không tạo được canvas để nén ảnh.")
  }
  return canvas
}

async function encodeCanvas(canvas: HTMLCanvasElement, hasAlpha: boolean) {
  const webpSupported = await canvasSupportsWebp()
  const preferred = selectEncodeMime({ webpSupported, hasAlpha })
  const first = await canvasToBlob(canvas, preferred, ADMIN_UPLOAD_QUALITY)
  if (first && (!first.type || first.type === preferred)) {
    return { blob: first, mime: preferred }
  }

  if (preferred === "image/webp") {
    const fallback = selectEncodeMime({ webpSupported: false, hasAlpha })
    const second = await canvasToBlob(canvas, fallback, ADMIN_UPLOAD_QUALITY)
    if (second && second.size > 0) {
      return { blob: second, mime: second.type || fallback }
    }
  }

  return null
}

/**
 * Resize so the long side is at most 2400px (never upscale), encode WebP at
 * 0.85, and fall back to JPEG 0.85. Transparent images stay WebP or PNG.
 * EXIF orientation is applied via createImageBitmap.
 */
export async function compressAdminImage(
  file: File,
  options?: { maxBytes?: number }
): Promise<File> {
  if (preparedFiles.has(file)) return file
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return file
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
      premultiplyAlpha: "none",
    })
  } catch {
    preparedFiles.add(file)
    return file
  }

  try {
    const fitted = fittedSize(bitmap.width, bitmap.height)
    const longEdge = Math.max(bitmap.width, bitmap.height)
    if (file.type === "image/gif" && fitted.scale === 1) {
      preparedFiles.add(file)
      return file
    }

    const canvas = renderFitted(bitmap, fitted.width, fitted.height)
    const hasAlpha = canvasHasAlpha(canvas)
    const encoded = await encodeCanvas(canvas, hasAlpha)
    if (!encoded || encoded.blob.size <= 0) {
      preparedFiles.add(file)
      return file
    }

    if (
      shouldKeepOriginalFile({
        originalBytes: file.size,
        compressedBytes: encoded.blob.size,
        originalLongEdge: longEdge,
        maxBytes: options?.maxBytes,
      })
    ) {
      preparedFiles.add(file)
      return file
    }

    const compressed = new File(
      [encoded.blob],
      fileNameForMime(file.name, encoded.mime),
      { type: encoded.mime, lastModified: Date.now() }
    )
    preparedFiles.add(compressed)
    return compressed
  } finally {
    bitmap.close()
  }
}
