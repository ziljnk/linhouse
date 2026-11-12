import type { UploadedImage } from "@/components/admin/image-uploader"
import { compressAdminImage } from "@/lib/admin-image-compress"
import { ADMIN_SERVER_BUSY_MESSAGE, isBusyHttpStatus } from "@/lib/admin-request-errors"
import type { CmsImageType } from "@/lib/cms-image"
import { parseCmsStorageKey } from "@/lib/cms-image"

export class AdminSessionExpiredError extends Error {
  constructor() {
    super("Phiên đăng nhập đã hết hạn.")
    this.name = "AdminSessionExpiredError"
  }
}

export class AdminServerBusyError extends Error {
  constructor() {
    super(ADMIN_SERVER_BUSY_MESSAGE)
    this.name = "AdminServerBusyError"
  }
}

const UPLOAD_ATTEMPTS = 3
const RETRY_DELAYS_MS = [1000, 3000]
const RETRYABLE_STATUSES = new Set([429, 500])

type UploadPayload = {
  storageKey?: string
  error?: string
}

type UploadListener = (imageId: string | null) => void

const uploadListeners = new Set<UploadListener>()

export function subscribeAdminUploadProgress(listener: UploadListener) {
  uploadListeners.add(listener)
  return () => {
    uploadListeners.delete(listener)
  }
}

function emitUploadProgress(imageId: string | null) {
  for (const listener of uploadListeners) listener(imageId)
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
  } catch {
    throw new AdminServerBusyError()
  }

  if (isBusyHttpStatus(response.status)) throw new AdminServerBusyError()

  let payload: UploadPayload = {}
  try {
    payload = (await response.json()) as UploadPayload
  } catch {
    if (response.status === 401) throw new AdminSessionExpiredError()
    if (response.status >= 500 || response.status === 408) throw new AdminServerBusyError()
    throw new ImageUploadError(
      "Không tải được ảnh lên máy chủ.",
      RETRYABLE_STATUSES.has(response.status)
    )
  }

  if (response.status === 401) throw new AdminSessionExpiredError()

  if (response.ok && payload.storageKey) {
    return payload.storageKey
  }

  throw new ImageUploadError(
    payload.error || "Không tải được ảnh lên máy chủ.",
    RETRYABLE_STATUSES.has(response.status)
  )
}

async function uploadImageFile(file: File, type: CmsImageType) {
  const prepared = await compressAdminImage(file)
  let lastError: Error | undefined

  for (let attempt = 0; attempt < UPLOAD_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await wait(RETRY_DELAYS_MS[attempt - 1] ?? 3000)
    }

    try {
      return await postImageFile(prepared, type)
    } catch (error) {
      if (error instanceof AdminSessionExpiredError) throw error
      if (error instanceof AdminServerBusyError) throw error
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

  try {
    for (const image of images) {
      if (!image.file) {
        stored.push(parseCmsStorageKey(image.url) ?? image.url)
        continue
      }

      emitUploadProgress(image.id)
      stored.push(await uploadImageFile(image.file, type))
    }
  } finally {
    emitUploadProgress(null)
  }

  return stored
}
