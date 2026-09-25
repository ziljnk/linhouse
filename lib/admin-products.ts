import {
  productSlug,
  PRODUCT_KINDS,
  PRODUCT_PURCHASE_OPTIONS,
  type CatalogProduct,
  type ProductKind,
  type ProductPurchaseOption,
} from "@/lib/catalog"
import {
  CONTENT_LIST_FILTER_LABELS,
  CONTENT_LIST_FILTERS,
  formatPublishedAt,
  type ContentListFilter,
} from "@/lib/content-status"

export {
  PRODUCT_KINDS,
  PRODUCT_PURCHASE_OPTIONS,
  type ProductKind,
  type ProductPurchaseOption,
}

export const PRODUCT_PURCHASE_OPTION_LABELS: Record<
  ProductPurchaseOption,
  string
> = {
  rent: "Có sẵn cho thuê",
  "made-to-order": "May đo",
  "ready-to-purchase": "Sẵn sàng mua",
}

export const PRODUCT_KIND_LABELS: Record<ProductKind, string> = {
  gown: "Váy cưới",
  "ao-dai": "Áo dài",
}

export const PRODUCT_STATUSES = CONTENT_LIST_FILTERS

export type ProductStatus = ContentListFilter

export const PRICE_DISPLAYS = ["contact", "amount"] as const

export type PriceDisplay = (typeof PRICE_DISPLAYS)[number]

export type AdminProductListItem = {
  id: string
  slug: string
  name: string
  fullName: string
  code: string
  image: string
  price: number | null
  priceDisplay: PriceDisplay
  kind: ProductKind
  category: string
  collections: string[]
  status: ProductStatus
  publishedAt: string | null
}

export const PRICE_DISPLAY_LABELS: Record<PriceDisplay, string> = {
  contact: "Liên hệ",
  amount: "Hiển thị giá",
}

export const PRODUCT_STATUS_LABELS = CONTENT_LIST_FILTER_LABELS

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

function productPublishedAt(name: string, status: ProductStatus): string | null {
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
  const slug = productSlug(product)

  const status = productStatus(product.name)

  return {
    id: slug,
    slug,
    name: product.name,
    fullName: product.name,
    code: product.code ?? "",
    image: product.image,
    price: productPrice(product.name),
    priceDisplay: "amount",
    kind: product.kind ?? "gown",
    category: CATEGORY_LABELS[product.silhouette] ?? product.silhouette,
    collections: product.collections.map(
      (collectionSlug) => collectionLabels[collectionSlug] ?? collectionSlug
    ),
    status,
    publishedAt: productPublishedAt(product.name, status),
  }
}

export function formatVnd(amount: number | null) {
  if (amount == null) return "—"
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatProductPrice(
  amount: number | null,
  display: PriceDisplay = "contact"
) {
  if (display === "contact") return PRICE_DISPLAY_LABELS.contact
  return formatVnd(amount)
}

export function parsePriceVnd(value: string) {
  const digits = value.replace(/\D/g, "")
  if (!digits) return null
  const amount = Number(digits)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function formatPriceInput(value: string) {
  const digits = value.replace(/\D/g, "")
  if (!digits) return ""
  return new Intl.NumberFormat("vi-VN").format(Number(digits))
}

export { formatPublishedAt as formatScheduledAt }
