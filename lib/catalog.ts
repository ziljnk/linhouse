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

const GALLERY_HEIGHTS = [400, 250, 600, 350, 500, 280, 450, 320, 540]

const LOOKBOOK_POOL = [
  "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1510070009289-b5bc34383727?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1550005809-91ad75fb315f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1445431928240-2771ba27f0ce?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1509927083803-4bed4726557a?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515932799417-2456d6ba80d9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1545239705-1564e58b9e4a?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1529634597493-8c9638abdbee?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1478146896981-b80fe407b86d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1519223484940-8ea749b2e8eb?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1522673141818-6b7c0e6c0e6e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1583939412120-5c5c80e00dc1?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1520855144806-7bdd4c0c4c8e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80",
]

export type CollectionGalleryItem = {
  id: string
  img: string
  url: string
  height: number
  alt: string
}

export function collectionGallery(
  collection: CollectionItem,
  catalog: Dictionary["catalog"],
  minCount = 32
): CollectionGalleryItem[] {
  const slug = collection.href.replace("/catalog/", "")
  const seen = new Set<string>()
  const items: { src: string; alt: string }[] = []

  const add = (src: string, alt: string) => {
    if (seen.has(src)) return
    seen.add(src)
    items.push({ src, alt })
  }

  add(collection.image, collection.imageAlt)

  for (const product of catalog) {
    if (product.collections.includes(slug)) {
      add(product.image, product.name)
    }
  }

  for (const product of catalog) {
    add(product.image, collection.imageAlt)
  }

  const offset = slug.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
  for (let i = 0; i < LOOKBOOK_POOL.length && items.length < minCount; i++) {
    add(LOOKBOOK_POOL[(offset + i) % LOOKBOOK_POOL.length], collection.imageAlt)
  }

  return items.map((item, index) => ({
    id: `${slug}-${index}`,
    img: item.src,
    url: "",
    alt: item.alt,
    height: GALLERY_HEIGHTS[index % GALLERY_HEIGHTS.length],
  }))
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
