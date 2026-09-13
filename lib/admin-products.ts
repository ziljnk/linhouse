import { parseProductName, productSlug, type CatalogProduct } from "@/lib/catalog"

export const PRODUCT_STATUSES = ["published", "scheduled", "draft"] as const

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export type AdminProductListItem = {
  id: string
  slug: string
  name: string
  fullName: string
  code: string
  image: string
  price: number
  category: string
  collections: string[]
  status: ProductStatus
  scheduledAt: string | null
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  published: "Đã đăng",
  scheduled: "Đã lên lịch",
  draft: "Draft",
}

const CATEGORY_LABELS: Record<string, string> = {
  "ball-gown": "Váy sân khấu",
  "a-line": "Váy dáng A",
  "mini-dress": "Váy ngắn",
  "2-in-1": "Váy 2 trong 1",
}

function nameHash(name: string) {
  return name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function productPrice(name: string) {
  return (18 + (nameHash(name) % 48)) * 1_000_000
}

function productStatus(name: string): ProductStatus {
  const hash = nameHash(name)
  const roll = hash % 10
  if (roll < 6) return "published"
  if (roll < 8) return "scheduled"
  return "draft"
}

function productScheduledAt(name: string, status: ProductStatus): string | null {
  if (status !== "scheduled") return null

  const hash = nameHash(name)
  const date = new Date("2026-09-11T08:00:00+07:00")
  date.setUTCDate(date.getUTCDate() + (hash % 14) + 1)
  date.setUTCHours(1 + (hash % 10), (hash * 7) % 60, 0, 0)
  return date.toISOString()
}

export function toAdminProductListItem(
  product: CatalogProduct,
  collectionLabels: Record<string, string>
): AdminProductListItem {
  const { shortName, code } = parseProductName(product.name)
  const slug = productSlug(product)

  const status = productStatus(product.name)

  return {
    id: slug,
    slug,
    name: shortName,
    fullName: product.name,
    code,
    image: product.image,
    price: productPrice(product.name),
    category: CATEGORY_LABELS[product.silhouette] ?? product.silhouette,
    collections: product.collections.map(
      (collectionSlug) => collectionLabels[collectionSlug] ?? collectionSlug
    ),
    status,
    scheduledAt: productScheduledAt(product.name, status),
  }
}

export function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatScheduledAt(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso))
}
