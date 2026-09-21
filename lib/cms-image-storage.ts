import { randomUUID } from "node:crypto"
import { mkdir, rm } from "node:fs/promises"
import path from "node:path"
import { inArray } from "drizzle-orm"
import {
  parseCmsStorageKey,
  type CmsImageType,
} from "@/lib/cms-image"
import { writeWebpVariants } from "@/lib/cms-image-variants"
import { db } from "@/lib/db"
import {
  blogPost,
  collection,
  collectionImage,
  media,
  productImage,
  testimonial,
} from "@/lib/db/schema"

export type SavedCmsImage = {
  id: string
  storageKey: string
  width: number
  height: number
  format: "webp"
}

function uploadsRoot() {
  return path.resolve(process.cwd(), "public", "uploads")
}

function assertStorageDir(storageKey: string) {
  const key = parseCmsStorageKey(storageKey)
  if (!key) {
    throw new Error("storageKey không hợp lệ.")
  }

  const root = uploadsRoot()
  const dir = path.resolve(root, key)
  if (dir !== root && !dir.startsWith(root + path.sep)) {
    throw new Error("storageKey không hợp lệ.")
  }
  return dir
}

async function removeStorageDir(storageKey: string) {
  const dir = assertStorageDir(storageKey)
  await rm(dir, { recursive: true, force: true })
}

export async function saveCmsImageVariants(
  buffer: Buffer,
  type: CmsImageType
): Promise<SavedCmsImage> {
  const id = randomUUID()
  const storageKey = `${type}/${id}`
  const dir = assertStorageDir(storageKey)
  await mkdir(dir, { recursive: true })

  try {
    const metadata = await writeWebpVariants(buffer, dir)

    await db.insert(media).values({
      id,
      type,
      storageKey,
      width: metadata.width,
      height: metadata.height,
      mimeType: "image/webp",
    })

    return {
      id,
      storageKey,
      width: metadata.width,
      height: metadata.height,
      format: "webp",
    }
  } catch (error) {
    await removeStorageDir(storageKey).catch(() => undefined)
    throw error
  }
}

async function storageKeysInUse(keys: string[]) {
  if (!keys.length) return new Set<string>()

  const [products, collectionCovers, collectionImages, posts, stories] =
    await Promise.all([
      db
        .select({ value: productImage.url })
        .from(productImage)
        .where(inArray(productImage.url, keys)),
      db
        .select({ value: collection.coverUrl })
        .from(collection)
        .where(inArray(collection.coverUrl, keys)),
      db
        .select({ value: collectionImage.url })
        .from(collectionImage)
        .where(inArray(collectionImage.url, keys)),
      db
        .select({ value: blogPost.coverUrl })
        .from(blogPost)
        .where(inArray(blogPost.coverUrl, keys)),
      db
        .select({ value: testimonial.imageUrl })
        .from(testimonial)
        .where(inArray(testimonial.imageUrl, keys)),
    ])

  return new Set(
    [...products, ...collectionCovers, ...collectionImages, ...posts, ...stories]
      .map((row) => parseCmsStorageKey(row.value))
      .filter((key): key is string => key !== null)
  )
}

export async function cleanupRemovedCmsImages(
  previous: string[],
  next: string[]
) {
  const keep = new Set(
    next
      .map((value) => parseCmsStorageKey(value))
      .filter((key): key is string => key !== null)
  )
  const candidates = [
    ...new Set(
      previous
        .map((value) => parseCmsStorageKey(value))
        .filter((key): key is string => key !== null && !keep.has(key))
    ),
  ]
  if (!candidates.length) return

  const used = await storageKeysInUse(candidates)
  const removable = candidates.filter((key) => !used.has(key))
  if (!removable.length) return

  await Promise.all(
    removable.map(async (storageKey) => {
      await removeStorageDir(storageKey).catch(() => undefined)
    })
  )

  await db.delete(media).where(inArray(media.storageKey, removable))
}
