import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"

export const CATALOG_FILTER_KEYS = ["silhouette", "neckline", "fabric"] as const

export type CatalogFilterKey = (typeof CATALOG_FILTER_KEYS)[number]

export type CatalogProduct = Dictionary["catalog"][number]

export type CollectionItem = Dictionary["home"]["collection"]["items"][number]

export type CatalogPageCopy = Dictionary["catalogPage"]

export type CatalogFilterGroup = {
  key: CatalogFilterKey
  title: string
  options: { value: string; label: string }[]
}

export function findCollection(dict: Dictionary, slug: string) {
  return dict.home.collection.items.find((item) => item.href === `/catalog/${slug}`)
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

export function catalogProductsForSlug(
  catalog: Dictionary["catalog"],
  slug: string
) {
  if (slug === "all-gowns" || slug === "all-ao-dai") return catalog

  const inCollection = catalog.filter((product) =>
    product.collections.includes(slug)
  )
  if (inCollection.length) return inCollection

  return catalog.filter(
    (product) =>
      product.silhouette === slug ||
      product.neckline === slug ||
      product.fabric === slug
  )
}

export function parseProductName(name: string) {
  const [code, ...rest] = name.split(" — ")
  const title = rest.join(" — ") || name
  const shortName = rest[0] ?? code

  return { code, title, shortName }
}

export function productSlug(product: CatalogProduct) {
  return parseProductName(product.name)
    .shortName.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function productHref(locale: Locale, product: CatalogProduct) {
  return `/${locale}/product/${productSlug(product)}`
}

export function findProduct(catalog: Dictionary["catalog"], slug: string) {
  return catalog.find((product) => productSlug(product) === slug)
}

export function productSlugs(catalog: Dictionary["catalog"]) {
  return catalog.map((product) => productSlug(product))
}

export function catalogOptionLabel(
  dict: Dictionary,
  key: CatalogFilterKey,
  value: string
) {
  const group = catalogFilterGroups(dict).find((item) => item.key === key)
  return group?.options.find((option) => option.value === value)?.label ?? value
}

export function collectionLabel(dict: Dictionary, slug: string) {
  return findCollection(dict, slug)?.name ?? slug
}

function uniqueProducts(products: CatalogProduct[], count: number) {
  const unique: CatalogProduct[] = []
  const seen = new Set<string>()

  for (const product of products) {
    if (seen.has(product.name)) continue
    seen.add(product.name)
    unique.push(product)
    if (unique.length === count) break
  }

  return unique
}

export function productGallery(
  product: CatalogProduct,
  catalog: Dictionary["catalog"]
) {
  const images = [product.image]
  const seen = new Set(images)
  const pool = [
    ...catalog.filter(
      (item) => item.silhouette === product.silhouette && item.name !== product.name
    ),
    ...catalog.filter((item) => item.name !== product.name),
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
  catalog: Dictionary["catalog"],
  product: CatalogProduct,
  count = 4
) {
  const rest = catalog.filter((item) => item.name !== product.name)
  return uniqueProducts(
    [
      ...rest.filter((item) => item.silhouette === product.silhouette),
      ...rest.filter((item) =>
        item.collections.some((slug) => product.collections.includes(slug))
      ),
      ...rest,
    ],
    count
  )
}

export function recommendedProducts(
  catalog: Dictionary["catalog"],
  product: CatalogProduct,
  related: CatalogProduct[],
  count = 4
) {
  const skip = new Set([product.name, ...related.map((item) => item.name)])
  const rest = catalog.filter((item) => !skip.has(item.name))

  return uniqueProducts(
    [
      ...rest.filter((item) => item.fabric === product.fabric),
      ...rest.filter((item) => item.neckline === product.neckline),
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
