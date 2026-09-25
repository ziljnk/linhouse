import { revalidatePath } from "next/cache"
import { and, eq, ne } from "drizzle-orm"
import { db } from "@/lib/db"
import { catalogAttribute, collection } from "@/lib/db/schema"
import { sanitizePlainText } from "@/lib/sanitize-content"
import type { LocalizedText } from "@/lib/site-settings"
import { slugify } from "@/lib/slug"

export { slugify }

export type ActionResult<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; data: T } | { ok: false; error: string }

export function actionOk(): { ok: true }
export function actionOk<T>(data: T): { ok: true; data: T }
export function actionOk<T>(data?: T) {
  return data === undefined ? { ok: true as const } : { ok: true as const, data }
}

export function actionFail(error: string): { ok: false; error: string } {
  return { ok: false, error }
}

export async function revalidateAdmin() {
  revalidatePath("/admin", "layout")
  revalidatePath("/vi", "layout")
  revalidatePath("/en", "layout")
}

export const VIRTUAL_CATALOG_SLUGS = new Set(["all-gowns", "all-ao-dai"])

export function toLocalized(vi: string, en = ""): LocalizedText {
  return { vi: sanitizePlainText(vi), en: sanitizePlainText(en) }
}

export function emptyLocalized(): LocalizedText {
  return { vi: "", en: "" }
}

export function requireSlug(value: string, label = "Đường dẫn") {
  const slug = slugify(value)
  if (!slug) return { ok: false as const, error: `Vui lòng nhập ${label.toLowerCase()}.` }
  return { ok: true as const, slug }
}

export function assertNotVirtualSlug(slug: string) {
  if (VIRTUAL_CATALOG_SLUGS.has(slug)) {
    return actionFail("Không dùng slug all-gowns hoặc all-ao-dai — đó là route ảo.")
  }
  return null
}

export async function isCatalogSlugTaken(
  slug: string,
  exclude?: { collectionId?: string; attributeId?: string }
) {
  const [collectionRow] = await db
    .select({ id: collection.id })
    .from(collection)
    .where(
      exclude?.collectionId
        ? and(eq(collection.slug, slug), ne(collection.id, exclude.collectionId))
        : eq(collection.slug, slug)
    )
    .limit(1)

  if (collectionRow) return true

  const [attributeRow] = await db
    .select({ id: catalogAttribute.id })
    .from(catalogAttribute)
    .where(
      exclude?.attributeId
        ? and(
            eq(catalogAttribute.slug, slug),
            ne(catalogAttribute.id, exclude.attributeId)
          )
        : eq(catalogAttribute.slug, slug)
    )
    .limit(1)

  return Boolean(attributeRow)
}
