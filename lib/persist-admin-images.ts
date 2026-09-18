import type { UploadedImage } from "@/components/admin/image-uploader"

export async function persistUploadedImages(images: UploadedImage[]) {
  const urls: string[] = []

  for (const image of images) {
    if (!image.file) {
      urls.push(image.url)
      continue
    }

    const body = new FormData()
    body.append("file", image.file)
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body,
    })
    const payload = (await response.json()) as { url?: string; error?: string }

    if (!response.ok || !payload.url) {
      throw new Error(payload.error || "Không tải được ảnh lên máy chủ.")
    }

    urls.push(payload.url)
  }

  return urls
}
