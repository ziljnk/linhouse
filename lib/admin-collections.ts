import type { CatalogProduct, CollectionItem } from "@/lib/catalog"

export const COLLECTION_STATUSES = ["published", "scheduled", "draft"] as const

export type CollectionStatus = (typeof COLLECTION_STATUSES)[number]

export type AdminCollectionListItem = {
  id: string
  slug: string
  name: string
  subtitle: string
  image: string
  imageAlt: string
  productCount: number
  status: CollectionStatus
  scheduledAt: string | null
}

export const COLLECTION_STATUS_LABELS: Record<CollectionStatus, string> = {
  published: "Đã đăng",
  scheduled: "Đã lên lịch",
  draft: "Draft",
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d")
    .replaceAll("Đ", "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function collectionSlug(item: CollectionItem) {
  return item.href.replace("/catalog/", "")
}

export function toAdminCollectionListItems(
  items: CollectionItem[],
  catalog: CatalogProduct[]
): AdminCollectionListItem[] {
  return items.map((item) => {
    const slug = collectionSlug(item)

    return {
      id: slug,
      slug,
      name: item.name,
      subtitle: item.subtitle,
      image: item.image,
      imageAlt: item.imageAlt,
      productCount: catalog.filter((product) =>
        product.collections.includes(slug)
      ).length,
      status: "published",
      scheduledAt: null,
    }
  })
}

export function findAdminCollection(
  collections: AdminCollectionListItem[],
  slug: string
): AdminCollectionListItem | undefined {
  return collections.find((collection) => collection.slug === slug)
}

export function formatScheduledAt(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso))
}
