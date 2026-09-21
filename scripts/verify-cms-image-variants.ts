import { mkdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import sharp from "sharp"
import { writeWebpVariants } from "@/lib/cms-image-variants"

async function assertVariant(
  file: string,
  sourceWidth: number,
  targetWidth: number
) {
  const meta = await sharp(file).metadata()
  const expected = Math.min(sourceWidth, targetWidth)
  if (meta.format !== "webp") {
    throw new Error(`${file} is ${meta.format}, expected webp`)
  }
  if (meta.width !== expected) {
    throw new Error(`${file} width ${meta.width}, expected ${expected}`)
  }
}

async function run() {
  const dir = path.join(tmpdir(), `linhouse-cms-image-${Date.now()}`)
  await mkdir(dir, { recursive: true })

  try {
    const jpeg = await sharp({
      create: {
        width: 600,
        height: 800,
        channels: 3,
        background: { r: 180, g: 140, b: 110 },
      },
    })
      .jpeg()
      .toBuffer()

    const png = await sharp({
      create: {
        width: 2400,
        height: 1600,
        channels: 3,
        background: { r: 40, g: 60, b: 80 },
      },
    })
      .png()
      .toBuffer()

    const webp = await sharp({
      create: {
        width: 320,
        height: 480,
        channels: 3,
        background: { r: 210, g: 190, b: 170 },
      },
    })
      .webp()
      .toBuffer()

    const smallDir = path.join(dir, "small")
    const largeDir = path.join(dir, "large")
    const tinyDir = path.join(dir, "tiny")

    await writeWebpVariants(jpeg, smallDir)
    await writeWebpVariants(png, largeDir)
    await writeWebpVariants(webp, tinyDir)

    await assertVariant(path.join(smallDir, "400w.webp"), 600, 400)
    await assertVariant(path.join(smallDir, "800w.webp"), 600, 800)
    await assertVariant(path.join(smallDir, "1200w.webp"), 600, 1200)

    await assertVariant(path.join(largeDir, "400w.webp"), 2400, 400)
    await assertVariant(path.join(largeDir, "800w.webp"), 2400, 800)
    await assertVariant(path.join(largeDir, "1200w.webp"), 2400, 1200)

    await assertVariant(path.join(tinyDir, "400w.webp"), 320, 400)
    await assertVariant(path.join(tinyDir, "800w.webp"), 320, 800)
    await assertVariant(path.join(tinyDir, "1200w.webp"), 320, 1200)

    console.log("CMS image variants: jpeg/png/webp + withoutEnlargement OK")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
