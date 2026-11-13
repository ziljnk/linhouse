import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { CMS_IMAGE_VARIANT_WIDTHS } from "@/lib/cms-image"
import { planVariantWrites } from "@/lib/cms-image-variant-plan"

const WEBP_QUALITY = 82
/** Lower than sharp's default (4) so variant encodes return the event loop sooner. */
const WEBP_EFFORT = 2

export type CmsImageMetadata = {
  width: number
  height: number
}

export async function writeWebpVariants(
  buffer: Buffer,
  dir: string,
  widths: readonly number[] = CMS_IMAGE_VARIANT_WIDTHS
): Promise<CmsImageMetadata> {
  await mkdir(dir, { recursive: true })
  const metadata = await sharp(buffer, { failOn: "none", animated: false }).metadata()
  if (!metadata.width || !metadata.height) {
    throw new Error("Không đọc được kích thước ảnh.")
  }

  const plan = planVariantWrites({
    width: metadata.width,
    height: metadata.height,
    orientation: metadata.orientation,
    format: metadata.format,
    widths,
  })
  const pipeline = sharp(buffer, {
    failOn: "none",
    animated: false,
    sequentialRead: true,
  }).rotate()
  const encoded = new Map<number, Buffer>()

  for (const step of plan) {
    let bytes = encoded.get(step.outputWidth)
    if (!bytes) {
      bytes = step.copySource
        ? buffer
        : await pipeline
            .clone()
            .resize({
              width: step.outputWidth,
              withoutEnlargement: true,
            })
            .webp({
              quality: WEBP_QUALITY,
              effort: WEBP_EFFORT,
              alphaQuality: 100,
            })
            .toBuffer()
      encoded.set(step.outputWidth, bytes)
    }
    await writeFile(path.join(dir, `${step.filenameWidth}w.webp`), bytes)
  }

  return { width: metadata.width, height: metadata.height }
}
