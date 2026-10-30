import { asc, count, eq } from "drizzle-orm"
import { contentAppearance } from "@/lib/content-status"
import { db } from "@/lib/db"
import { collection } from "@/lib/db/schema"
import {
  homeCarouselVersion,
  type HomeCarouselEditorData,
} from "@/lib/home-carousel"
import { decodeStoredPlainText } from "@/lib/sanitize-content"
import type { LocalizedText } from "@/lib/site-settings"

export type LockedCollectionRow = {
  id: string
  slug: string
  name: LocalizedText
  showOnHome: boolean
  homeOrder: number | null
}

type CollectionLocker = {
  select: typeof db.select
}

export function collectionCarouselLabel(name: LocalizedText, slug: string) {
  const vi = decodeStoredPlainText(name.vi ?? "")
  const en = decodeStoredPlainText(name.en ?? "")
  return vi || en || slug
}

export async function selectCollectionsForUpdate(
  tx: CollectionLocker
): Promise<LockedCollectionRow[]> {
  const rows = await tx
    .select({
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      showOnHome: collection.showOnHome,
      homeOrder: collection.homeOrder,
    })
    .from(collection)
    .orderBy(asc(collection.id))
    .for("update")

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    showOnHome: Boolean(row.showOnHome),
    homeOrder: row.homeOrder == null ? null : Number(row.homeOrder),
  }))
}

export async function countCollectionsOnHome() {
  const [row] = await db
    .select({ value: count() })
    .from(collection)
    .where(eq(collection.showOnHome, true))
  return Number(row?.value ?? 0)
}

export async function getHomeCarouselEditor(): Promise<HomeCarouselEditorData> {
  const rows = await db
    .select({
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      status: collection.status,
      publishedAt: collection.publishedAt,
      coverUrl: collection.coverUrl,
      showOnHome: collection.showOnHome,
      homeOrder: collection.homeOrder,
    })
    .from(collection)
    .orderBy(asc(collection.slug))

  const items = rows.map((row) => ({
    id: row.id,
    name: collectionCarouselLabel(row.name, row.slug),
    appearance: contentAppearance(row.status, row.publishedAt),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    coverUrl: row.coverUrl,
    showOnHome: Boolean(row.showOnHome),
    homeOrder: row.homeOrder == null ? null : Number(row.homeOrder),
  }))

  return {
    version: homeCarouselVersion(items),
    items,
  }
}
