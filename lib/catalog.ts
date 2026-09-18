import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"

export const PRODUCT_KINDS = ["gown", "ao-dai"] as const
export type ProductKind = (typeof PRODUCT_KINDS)[number]

export const CATALOG_FILTER_KEYS = ["silhouette", "neckline", "fabric"] as const
export const CATALOG_INITIAL_PAGE_SIZE = 20
export const CATALOG_LOAD_MORE_SIZE = 8

export type CatalogFilterKey = (typeof CATALOG_FILTER_KEYS)[number]

export type CatalogProduct = Dictionary["catalog"][number] & {
  slug?: string
  images?: string[]
  attributeSlugs?: string[]
  attributesByGroup?: Record<string, string[]>
  featured?: boolean
  description?: string
  seoTitle?: string
  seoDescription?: string
  priceVnd?: number | null
  priceDisplay?: "amount" | "contact"
  kind?: ProductKind
}

export type CollectionItem = Dictionary["home"]["collection"]["items"][number] & {
  galleryUrls?: string[]
  year?: number | null
  seoTitle?: string
  seoDescription?: string
}

export type CatalogPageCopy = Dictionary["catalogPage"]

export type CatalogFilterGroup = {
  key: string
  title: string
  kind?: ProductKind
  options: { value: string; label: string }[]
}

export function findCollection(
  source: Dictionary | CollectionItem[],
  slug: string
) {
  const items = Array.isArray(source) ? source : source.home.collection.items
  return items.find((item) => item.href === `/catalog/${slug}`)
}

const GALLERY_HEIGHTS = [400, 250, 600, 350, 500, 280, 450, 320, 540]

export type CollectionGalleryItem = {
  id: string
  img: string
  url: string
  height: number
  alt: string
}

export function collectionGallery(
  collection: CollectionItem
): CollectionGalleryItem[] {
  const slug = collection.href.replace("/catalog/", "")
  const seen = new Set<string>()
  const items: { src: string; alt: string }[] = []

  const add = (src: string, alt: string) => {
    if (!src || seen.has(src)) return
    seen.add(src)
    items.push({ src, alt })
  }

  for (const url of collection.galleryUrls ?? []) {
    add(url, collection.imageAlt)
  }

  return items.map((item, index) => ({
    id: `${slug}-${index}`,
    img: item.src,
    url: "",
    alt: item.alt,
    height: GALLERY_HEIGHTS[index % GALLERY_HEIGHTS.length],
  }))
}

export function productAttributeValues(
  product: CatalogProduct,
  groupKey: string
) {
  const grouped = product.attributesByGroup?.[groupKey]
  if (grouped?.length) return grouped

  if (
    groupKey === "silhouette" ||
    groupKey === "neckline" ||
    groupKey === "fabric"
  ) {
    const value = product[groupKey]
    return value ? [value] : []
  }

  return []
}

export function productMatchesFilters(
  product: CatalogProduct,
  filters: Record<string, string[]>
) {
  return Object.entries(filters).every(([key, selected]) => {
    if (selected.length === 0) return true
    const values = productAttributeValues(product, key)
    return selected.some((value) => values.includes(value))
  })
}

export function catalogFilterGroups(dict: Dictionary): CatalogFilterGroup[] {
  return CATALOG_FILTER_KEYS.map((key, index) => {
    const column = dict.nav.bridalColumns[index]
    return {
      key,
      title: column.title,
      options: column.links
        .filter((link) => !link.href.endsWith("/all-gowns"))
        .map((link) => ({
          value: link.href.replace("/catalog/", ""),
          label: link.label,
        })),
    }
  })
}

function productMatchesSlug(product: CatalogProduct, slug: string) {
  if (product.collections.includes(slug)) return true
  if (product.attributeSlugs?.includes(slug)) return true
  return (
    product.silhouette === slug ||
    product.neckline === slug ||
    product.fabric === slug
  )
}

export function productKindOf(product: CatalogProduct): ProductKind {
  return product.kind ?? "gown"
}

export function catalogKindForSlug(
  slug: string,
  groups: CatalogFilterGroup[]
): ProductKind | null {
  if (slug === "all-gowns") return "gown"
  if (slug === "all-ao-dai") return "ao-dai"
  const group = groups.find((item) =>
    item.options.some((option) => option.value === slug)
  )
  return group?.kind ?? null
}

export function filterGroupsForCatalogSlug(
  slug: string,
  groups: CatalogFilterGroup[]
) {
  const kind = catalogKindForSlug(slug, groups)
  if (!kind) return groups
  return groups.filter((group) => (group.kind ?? "gown") === kind)
}

export function productSpecRows(
  product: CatalogProduct,
  groups: CatalogFilterGroup[]
) {
  const kind = productKindOf(product)
  return groups
    .filter((group) => (group.kind ?? "gown") === kind)
    .map((group) => {
      const slugs = product.attributesByGroup?.[group.key] ?? fallbackGroupSlugs(product, group.key)
      const value = slugs
        .map((item) => catalogOptionLabel(groups, group.key, item))
        .filter(Boolean)
        .join(", ")
      return { label: group.title, value }
    })
    .filter((row) => row.value)
}

function fallbackGroupSlugs(product: CatalogProduct, key: string) {
  if (key === "silhouette" && product.silhouette) return [product.silhouette]
  if (key === "neckline" && product.neckline) return [product.neckline]
  if (key === "fabric" && product.fabric) return [product.fabric]
  return []
}

export function catalogProductsForSlug(catalog: CatalogProduct[], slug: string) {
  if (slug === "all-gowns") {
    return catalog.filter((product) => productKindOf(product) === "gown")
  }
  if (slug === "all-ao-dai") {
    return catalog.filter((product) => productKindOf(product) === "ao-dai")
  }

  const inCollection = catalog.filter((product) =>
    product.collections.includes(slug)
  )
  if (inCollection.length) return inCollection

  return catalog.filter((product) => productMatchesSlug(product, slug))
}

export function parseProductName(name: string) {
  const [code, ...rest] = name.split(" — ")
  const title = rest.join(" — ") || name
  const shortName = rest[0] ?? code

  return { code, title, shortName }
}

export function productSlug(product: CatalogProduct) {
  if (product.slug) return product.slug

  return parseProductName(product.name)
    .shortName.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function productHref(locale: Locale, product: CatalogProduct) {
  return `/${locale}/product/${productSlug(product)}`
}

export function showsProductPrice(product: CatalogProduct) {
  return (
    product.priceDisplay === "amount" &&
    product.priceVnd != null &&
    product.priceVnd > 0
  )
}

export function formatProductPriceVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function productPriceLabel(product: CatalogProduct, contactLabel: string) {
  if (!showsProductPrice(product) || product.priceVnd == null) return contactLabel
  return formatProductPriceVnd(product.priceVnd)
}

export function findProduct(catalog: CatalogProduct[], slug: string) {
  return catalog.find((product) => productSlug(product) === slug)
}

export function productSlugs(catalog: CatalogProduct[]) {
  return catalog.map((product) => productSlug(product))
}

export function catalogOptionLabel(
  source: Dictionary | CatalogFilterGroup[],
  key: string,
  value: string
) {
  const groups = Array.isArray(source) ? source : catalogFilterGroups(source)
  const group = groups.find((item) => item.key === key)
  return group?.options.find((option) => option.value === value)?.label ?? value
}

export function collectionLabel(
  source: Dictionary | CollectionItem[],
  slug: string
) {
  return findCollection(source, slug)?.name ?? slug
}

function productKey(product: CatalogProduct) {
  return productSlug(product)
}

function uniqueProducts(products: CatalogProduct[], count: number) {
  const unique: CatalogProduct[] = []
  const seen = new Set<string>()

  for (const product of products) {
    const key = productKey(product)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(product)
    if (unique.length === count) break
  }

  return unique
}

export function productGallery(product: CatalogProduct, catalog: CatalogProduct[]) {
  const images = [...(product.images?.length ? product.images : [product.image])]
  const seen = new Set(images)
  const pool = [
    ...catalog.filter(
      (item) =>
        productKindOf(item) === productKindOf(product) &&
        item.silhouette === product.silhouette &&
        productKey(item) !== productKey(product)
    ),
    ...catalog.filter(
      (item) =>
        productKindOf(item) === productKindOf(product) &&
        productKey(item) !== productKey(product)
    ),
    ...catalog.filter((item) => productKey(item) !== productKey(product)),
  ]

  for (const item of pool) {
    if (seen.has(item.image)) continue
    seen.add(item.image)
    images.push(item.image)
    if (images.length === 4) break
  }

  while (images.length < 4) images.push(product.image)
  return images
}

export function relatedProducts(
  catalog: CatalogProduct[],
  product: CatalogProduct,
  count = 4
) {
  const rest = catalog.filter((item) => productKey(item) !== productKey(product))
  const sameKind = rest.filter(
    (item) => productKindOf(item) === productKindOf(product)
  )
  return uniqueProducts(
    [
      ...sameKind.filter((item) => item.silhouette === product.silhouette),
      ...sameKind.filter((item) =>
        item.collections.some((slug) => product.collections.includes(slug))
      ),
      ...sameKind,
      ...rest,
    ],
    count
  )
}

export function recommendedProducts(
  catalog: CatalogProduct[],
  product: CatalogProduct,
  related: CatalogProduct[],
  count = 4
) {
  const skip = new Set([
    productKey(product),
    ...related.map((item) => productKey(item)),
  ])
  const rest = catalog.filter((item) => !skip.has(productKey(item)))
  const sameKind = rest.filter(
    (item) => productKindOf(item) === productKindOf(product)
  )

  return uniqueProducts(
    [
      ...sameKind.filter((item) => item.fabric === product.fabric),
      ...sameKind.filter((item) => item.neckline === product.neckline),
      ...sameKind,
      ...rest,
    ],
    count
  )
}

export function catalogSlugs(dict: Dictionary) {
  const slugs = new Set<string>()
  const columns = [
    ...dict.nav.homeColumns,
    ...dict.nav.collectionColumns,
    ...dict.nav.bridalColumns,
    ...dict.nav.aodaiColumns,
  ]

  for (const column of columns) {
    for (const link of column.links) {
      if (link.href.startsWith("/catalog/")) {
        slugs.add(link.href.replace("/catalog/", ""))
      }
    }
  }

  for (const item of dict.home.collection.items) {
    slugs.add(item.href.replace("/catalog/", ""))
  }

  return [...slugs]
}
