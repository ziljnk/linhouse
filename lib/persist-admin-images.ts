import type { UploadedImage } from "@/components/admin/image-uploader"
import type { CmsImageType } from "@/lib/cms-image"
import { parseCmsStorageKey } from "@/lib/cms-image"

const UPLOAD_ATTEMPTS = 3
const RETRY_DELAYS_MS = [1000, 3000]
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504, 524])

type UploadPayload = {
  storageKey?: string
  error?: string
}

class ImageUploadError extends Error {
  readonly retryable: boolean

  constructor(message: string, retryable: boolean) {
    super(message)
    this.name = "ImageUploadError"
    this.retryable = retryable
  }
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function postImageFile(file: File, type: CmsImageType) {
  const body = new FormData()
  body.append("file", file)
  body.append("type", type)

  let response: Response
  try {
    response = await fetch("/api/admin/upload", {
      method: "POST",
      body,
    })
  } catch (error) {
    throw new ImageUploadError(
      error instanceof Error ? error.message : "Không tải được ảnh lên máy chủ.",
      true
    )
  }

  let payload: UploadPayload = {}
  try {
    payload = (await response.json()) as UploadPayload
  } catch {
    throw new ImageUploadError(
      "Không tải được ảnh lên máy chủ.",
      RETRYABLE_STATUSES.has(response.status) || response.status >= 500
    )
  }

  if (response.ok && payload.storageKey) {
    return payload.storageKey
  }

  throw new ImageUploadError(
    payload.error || "Không tải được ảnh lên máy chủ.",
    RETRYABLE_STATUSES.has(response.status)
  )
}

async function uploadImageFile(file: File, type: CmsImageType) {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < UPLOAD_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await wait(RETRY_DELAYS_MS[attempt - 1] ?? 3000)
    }

    try {
      return await postImageFile(file, type)
    } catch (error) {
      const normalized =
        error instanceof ImageUploadError
          ? error
          : new ImageUploadError(
              error instanceof Error
                ? error.message
                : "Không tải được ảnh lên máy chủ.",
              false
            )
      lastError = normalized
      if (!normalized.retryable || attempt === UPLOAD_ATTEMPTS - 1) {
        throw new Error(normalized.message)
      }
    }
  }

  throw lastError ?? new Error("Không tải được ảnh lên máy chủ.")
}

export async function persistUploadedImages(
  images: UploadedImage[],
  type: CmsImageType
) {
  const stored: string[] = []

  for (const image of images) {
    if (!image.file) {
      stored.push(parseCmsStorageKey(image.url) ?? image.url)
      continue
    }

    stored.push(await uploadImageFile(image.file, type))
  }

  return stored
}
