import type { CatalogProduct, CollectionItem } from "@/lib/catalog"
import {
  CONTENT_LIST_FILTER_LABELS,
  CONTENT_LIST_FILTERS,
  formatPublishedAt,
  type ContentListFilter,
} from "@/lib/content-status"

export const COLLECTION_STATUSES = CONTENT_LIST_FILTERS

export type CollectionStatus = ContentListFilter

export type AdminCollectionListItem = {
  id: string
  slug: string
  name: string
  subtitle: string
  image: string
  imageAlt: string
  productCount: number
  status: CollectionStatus
  publishedAt: string | null
}

export const COLLECTION_STATUS_LABELS = CONTENT_LIST_FILTER_LABELS

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
      publishedAt: null,
    }
  })
}

export function findAdminCollection(
  collections: AdminCollectionListItem[],
  slug: string
): AdminCollectionListItem | undefined {
  return collections.find((collection) => collection.slug === slug)
}

export { formatPublishedAt as formatScheduledAt }
