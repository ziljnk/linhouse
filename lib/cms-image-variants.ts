import { mkdir } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { CMS_IMAGE_VARIANT_WIDTHS } from "@/lib/cms-image"

const WEBP_QUALITY = 82

export type CmsImageMetadata = {
  width: number
  height: number
}

export async function writeWebpVariants(
  buffer: Buffer,
  dir: string
): Promise<CmsImageMetadata> {
  await mkdir(dir, { recursive: true })
  const image = sharp(buffer, { failOn: "none", animated: false }).rotate()
  const metadata = await image.metadata()
  if (!metadata.width || !metadata.height) {
    throw new Error("Không đọc được kích thước ảnh.")
  }

  for (const width of CMS_IMAGE_VARIANT_WIDTHS) {
    await image
      .clone()
      .resize({
        width,
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(path.join(dir, `${width}w.webp`))
  }

  return { width: metadata.width, height: metadata.height }
}
