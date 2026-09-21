import type { UploadedImage } from "@/components/admin/image-uploader"
import type { CmsImageType } from "@/lib/cms-image"
import { parseCmsStorageKey } from "@/lib/cms-image"

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

    const body = new FormData()
    body.append("file", image.file)
    body.append("type", type)
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body,
    })
    const payload = (await response.json()) as {
      storageKey?: string
      url?: string
      error?: string
    }

    if (!response.ok || !payload.storageKey) {
      throw new Error(payload.error || "Không tải được ảnh lên máy chủ.")
    }

    stored.push(payload.storageKey)
  }

  return stored
}
