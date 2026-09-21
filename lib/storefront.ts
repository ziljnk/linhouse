import "server-only"

import { cache } from "react"
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm"
import type { Dictionary, Locale } from "@/app/[locale]/dictionaries"
import { VIRTUAL_CATALOG_SLUGS } from "@/lib/admin-actions"
import { isLiveContent } from "@/lib/content-schedule"
import {
  parseCatalogSort,
  parseProductName,
  productSlug,
  type CatalogFilterGroup,
  type CatalogProduct,
  type CatalogSort,
  type CollectionItem,
} from "@/lib/catalog"
import { db } from "@/lib/db"
import { jsonLocalizedContains, textContains } from "@/lib/db/search-sql"
import {
  attributeGroup,
  blogPost,
  catalogAttribute,
  collection,
  collectionImage,
  product,
  productAttribute,
  productCollection,
  productImage,
  siteCopy,
  testimonial,
} from "@/lib/db/schema"
import { isSearchableQuery, normalizeSearchQuery } from "@/lib/search-query"
import { getSiteSettings } from "@/lib/site-settings-store"
import {
  localizedValue,
  type LocalizedText,
  type SiteSettings,
} from "@/lib/site-settings"

export type StorefrontBlogPost = {
  slug: string
  title: string
  date: string
  image: string
  imageAlt: string
  excerpt: string
  content: string
  seoTitle: string
  seoDescription: string
}

export type StorefrontHero = {
  headline: string
  subhead: string
  description: string
  cta: string
  imageAlt: string
  imageUrl: string
}

type StorefrontRows = Awaited<ReturnType<typeof loadStorefrontRows>>

function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return typeof record.vi === "string" || typeof record.en === "string"
}

function asLocalized(value: LocalizedText | null | undefined): LocalizedText {
  return { vi: value?.vi ?? "", en: value?.en ?? "" }
}

function textOf(
  value: LocalizedText | null | undefined,
  locale: Locale,
  fallback = ""
) {
  const localized = localizedValue(asLocalized(value), locale).trim()
  if (localized) return localized
  return fallback
}

function copyRecord(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function copyText(value: unknown, locale: Locale, fallback: string) {
  if (typeof value === "string" && value.trim()) return value
  if (isLocalizedText(value)) return textOf(value, locale, fallback)
  return fallback
}

function isLiveProduct() {
  return isLiveContent(product.status, product.publishedAt)
}

function isLivePost() {
  return isLiveContent(blogPost.status, blogPost.publishedAt)
}

function isLiveCollection() {
  return isLiveContent(collection.status, collection.publishedAt)
}

function productDisplayName(row: {
  sortNumber: number
  name: string
  code: string
  fullTitle: string
}) {
  const parts: string[] = []
  if (row.sortNumber > 0) parts.push(`No.${row.sortNumber}`)
  parts.push(row.name)
  const rest = [row.code, row.fullTitle].filter(Boolean).join(" ")
  if (rest) parts.push(rest)
  return parts.join(" — ")
}

function formatBlogDate(date: Date | null, locale: Locale) {
  if (!date) return ""
  if (locale === "vi") {
    return `${date.getUTCDate()} Thg ${date.getUTCMonth() + 1}, ${date.getUTCFullYear()}`
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function attributeForGroup(
  attributes: StorefrontRows["productAttributes"],
  productId: string,
  groupSlug: string
) {
  return (
    attributes.find(
      (item) => item.productId === productId && item.groupSlug === groupSlug
    )?.slug ?? ""
  )
}

type ProductMapRows = Pick<
  StorefrontRows,
  "products" | "productImages" | "productCollections" | "productAttributes"
>

export type CatalogQueryFilters = Record<string, string[]>

function pricedFirst() {
  return sql`case when ${product.priceDisplay} = 'amount' and ${product.priceVnd} is not null then 0 else 1 end`
}

function catalogOrderBy(sort: CatalogSort): SQL[] {
  switch (sort) {
    case "newest":
      return [
        desc(product.publishedAt),
        desc(product.createdAt),
        asc(product.sortOrder),
      ]
    case "price-asc":
      return [pricedFirst(), asc(product.priceVnd), asc(product.sortOrder)]
    case "price-desc":
      return [pricedFirst(), desc(product.priceVnd), asc(product.sortOrder)]
    case "name-asc":
      return [asc(product.name), asc(product.sortOrder)]
    case "name-desc":
      return [desc(product.name), asc(product.sortOrder)]
    case "featured":
    default:
      return [
        asc(product.sortOrder),
        asc(product.sortNumber),
        asc(product.name),
      ]
  }
}

function isSafeCatalogSlug(value: string) {
  return value.length > 0 && value.length <= 120 && !/[\s\\/\0]/.test(value)
}

function sanitizeCatalogFilters(filters: CatalogQueryFilters | undefined) {
  const result: CatalogQueryFilters = {}
  if (!filters) return result

  for (const [key, values] of Object.entries(filters)) {
    if (!isSafeCatalogSlug(key) || !Array.isArray(values)) continue
    const slugs = [
      ...new Set(
        values.filter((value): value is string => {
          return typeof value === "string" && isSafeCatalogSlug(value)
        })
      ),
    ]
    if (slugs.length > 0) result[key] = slugs
  }

  return result
}

function hasProductImage() {
  return exists(
    db
      .select({ id: productImage.id })
      .from(productImage)
      .where(eq(productImage.productId, product.id))
  )
}

function productInCollection(collectionId: string) {
  return exists(
    db
      .select({ productId: productCollection.productId })
      .from(productCollection)
      .where(
        and(
          eq(productCollection.productId, product.id),
          eq(productCollection.collectionId, collectionId)
        )
      )
  )
}

function productHasAttributeSlug(slug: string) {
  return exists(
    db
      .select({ productId: productAttribute.productId })
      .from(productAttribute)
      .innerJoin(
        catalogAttribute,
        eq(productAttribute.attributeId, catalogAttribute.id)
      )
      .where(
        and(
          eq(productAttribute.productId, product.id),
          eq(catalogAttribute.slug, slug)
        )
      )
  )
}

function productMatchesFilterGroup(groupSlug: string, values: string[]) {
  return exists(
    db
      .select({ productId: productAttribute.productId })
      .from(productAttribute)
      .innerJoin(
        catalogAttribute,
        eq(productAttribute.attributeId, catalogAttribute.id)
      )
      .innerJoin(attributeGroup, eq(catalogAttribute.groupId, attributeGroup.id))
      .where(
        and(
          eq(productAttribute.productId, product.id),
          eq(attributeGroup.slug, groupSlug),
          inArray(catalogAttribute.slug, values)
        )
      )
  )
}

async function catalogProductWhere(
  slug: string,
  filters: CatalogQueryFilters
) {
  const conditions = [isLiveProduct(), hasProductImage()]

  if (slug === "all-gowns") {
    conditions.push(eq(product.kind, "gown"))
  } else if (slug === "all-ao-dai") {
    conditions.push(eq(product.kind, "ao-dai"))
  } else {
    const [collectionRow] = await db
      .select({ id: collection.id })
      .from(collection)
      .where(eq(collection.slug, slug))
      .limit(1)

    if (collectionRow) {
      conditions.push(productInCollection(collectionRow.id))
    } else {
      conditions.push(productHasAttributeSlug(slug))
      const [group] = await db
        .select({ kind: attributeGroup.kind })
        .from(catalogAttribute)
        .innerJoin(
          attributeGroup,
          eq(catalogAttribute.groupId, attributeGroup.id)
        )
        .where(eq(catalogAttribute.slug, slug))
        .limit(1)
      if (group) conditions.push(eq(product.kind, group.kind))
    }
  }

  for (const [groupSlug, values] of Object.entries(filters)) {
    if (values.length === 0) continue
    conditions.push(productMatchesFilterGroup(groupSlug, values))
  }

  return and(...conditions)
}

async function hydrateCatalogProducts(
  products: StorefrontRows["products"],
  locale: Locale
) {
  if (products.length === 0) return []

  const ids = products.map((row) => row.id)
  const [productImages, productCollections, productAttributes] =
    await Promise.all([
      db.select().from(productImage).where(inArray(productImage.productId, ids)),
      db
        .select({
          productId: productCollection.productId,
          slug: collection.slug,
        })
        .from(productCollection)
        .innerJoin(collection, eq(productCollection.collectionId, collection.id))
        .where(inArray(productCollection.productId, ids)),
      db
        .select({
          productId: productAttribute.productId,
          slug: catalogAttribute.slug,
          groupSlug: attributeGroup.slug,
        })
        .from(productAttribute)
        .innerJoin(
          catalogAttribute,
          eq(productAttribute.attributeId, catalogAttribute.id)
        )
        .innerJoin(
          attributeGroup,
          eq(catalogAttribute.groupId, attributeGroup.id)
        )
        .where(inArray(productAttribute.productId, ids)),
    ])

  return mapProducts(
    {
      products,
      productImages,
      productCollections,
      productAttributes,
    },
    locale
  )
}

export async function listStorefrontCatalog({
  locale,
  slug,
  filters,
  sort,
  offset,
  limit,
}: {
  locale: Locale
  slug: string
  filters?: CatalogQueryFilters
  sort?: CatalogSort
  offset: number
  limit: number
}) {
  const safeSlug = slug.trim()
  if (!isSafeCatalogSlug(safeSlug)) {
    return { products: [] as CatalogProduct[], total: 0 }
  }

  const safeOffset = Math.max(0, Math.floor(offset))
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 20))
  const orderBy = catalogOrderBy(parseCatalogSort(sort))
  const where = await catalogProductWhere(
    safeSlug,
    sanitizeCatalogFilters(filters)
  )

  const [countRow, rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(product)
      .where(where)
      .then((result) => result[0]),
    db
      .select()
      .from(product)
      .where(where)
      .orderBy(...orderBy)
      .limit(safeLimit)
      .offset(safeOffset),
  ])

  return {
    products: await hydrateCatalogProducts(rows, locale),
    total: countRow?.total ?? 0,
  }
}

const SEARCH_LIMIT = 6

export type StorefrontSearchHit = {
  type: "product" | "collection" | "blog"
  slug: string
  title: string
  href: string
  image: string
}

function likePattern(query: string) {
  return `%${query.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`
}

export async function searchStorefront({
  locale,
  query,
}: {
  locale: Locale
  query: string
}): Promise<StorefrontSearchHit[]> {
  const q = normalizeSearchQuery(query)
  if (!isSearchableQuery(q)) return []

  const pattern = likePattern(q)

  const matchProduct = or(
    textContains(product.name, pattern),
    textContains(product.code, pattern),
    textContains(product.fullTitle, pattern),
    textContains(product.slug, pattern)
  )

  const [productRows, collectionRows, blogRows] = await Promise.all([
    db
      .select({
        slug: product.slug,
        name: product.name,
        code: product.code,
        fullTitle: product.fullTitle,
        sortNumber: product.sortNumber,
      })
      .from(product)
      .where(and(isLiveProduct(), matchProduct))
      .orderBy(asc(product.sortOrder), asc(product.sortNumber), asc(product.name))
      .limit(SEARCH_LIMIT),
    db
      .select({
        slug: collection.slug,
        name: collection.name,
        coverUrl: collection.coverUrl,
      })
      .from(collection)
      .where(
        and(
          isLiveCollection(),
          or(
            jsonLocalizedContains(collection.name, pattern),
            jsonLocalizedContains(collection.subtitle, pattern),
            textContains(collection.slug, pattern)
          )
        )
      )
      .orderBy(asc(collection.sortOrder), asc(collection.slug))
      .limit(SEARCH_LIMIT),
    db
      .select({
        slug: blogPost.slug,
        title: blogPost.title,
        coverUrl: blogPost.coverUrl,
      })
      .from(blogPost)
      .where(
        and(
          isLivePost(),
          or(
            jsonLocalizedContains(blogPost.title, pattern),
            jsonLocalizedContains(blogPost.excerpt, pattern),
            textContains(blogPost.slug, pattern)
          )
        )
      )
      .orderBy(desc(blogPost.publishedAt), desc(blogPost.updatedAt))
      .limit(SEARCH_LIMIT),
  ])

  const slugs = productRows.map((row) => row.slug)
  const productImages =
    slugs.length === 0
      ? []
      : await db
          .select({
            slug: product.slug,
            url: productImage.url,
            sortOrder: productImage.sortOrder,
          })
          .from(productImage)
          .innerJoin(product, eq(productImage.productId, product.id))
          .where(inArray(product.slug, slugs))

  const imageBySlug = new Map<string, string>()
  for (const row of [...productImages].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (!imageBySlug.has(row.slug)) imageBySlug.set(row.slug, row.url)
  }

  return [
    ...productRows.map((row) => ({
      type: "product" as const,
      slug: row.slug,
      title: productDisplayName(row),
      href: `/${locale}/product/${row.slug}`,
      image: imageBySlug.get(row.slug) ?? "",
    })),
    ...collectionRows.map((row) => ({
      type: "collection" as const,
      slug: row.slug,
      title: textOf(row.name, locale, row.slug),
      href: `/${locale}/catalog/${row.slug}`,
      image: row.coverUrl,
    })),
    ...blogRows.map((row) => ({
      type: "blog" as const,
      slug: row.slug,
      title: textOf(row.title, locale, row.slug),
      href: `/${locale}/blog/${row.slug}`,
      image: row.coverUrl,
    })),
  ]
}

function mapProducts(
  rows: ProductMapRows,
  locale: Locale
): CatalogProduct[] {
  const imagesByProduct = new Map<string, string[]>()
  for (const image of [...rows.productImages].sort(
    (a, b) => a.sortOrder - b.sortOrder
  )) {
    const list = imagesByProduct.get(image.productId) ?? []
    list.push(image.url)
    imagesByProduct.set(image.productId, list)
  }

  const collectionsByProduct = new Map<string, string[]>()
  for (const item of rows.productCollections) {
    const list = collectionsByProduct.get(item.productId) ?? []
    if (!list.includes(item.slug)) list.push(item.slug)
    collectionsByProduct.set(item.productId, list)
  }

  return rows.products.map((row) => {
    const images = imagesByProduct.get(row.id) ?? []
    const attributeSlugs = rows.productAttributes
      .filter((item) => item.productId === row.id)
      .map((item) => item.slug)

    const attributesByGroup: Record<string, string[]> = {}
    for (const item of rows.productAttributes) {
      if (item.productId !== row.id) continue
      const list = attributesByGroup[item.groupSlug] ?? []
      if (!list.includes(item.slug)) list.push(item.slug)
      attributesByGroup[item.groupSlug] = list
    }

    return {
      slug: row.slug,
      name: productDisplayName(row),
      image: images[0] ?? "",
      images,
      collections: collectionsByProduct.get(row.id) ?? [],
      silhouette: attributeForGroup(rows.productAttributes, row.id, "silhouette"),
      neckline: attributeForGroup(rows.productAttributes, row.id, "neckline"),
      fabric: attributeForGroup(rows.productAttributes, row.id, "fabric"),
      attributeSlugs,
      attributesByGroup,
      featured: row.featured,
      kind: row.kind,
      priceVnd: row.priceVnd,
      priceDisplay: row.priceDisplay,
      description: textOf(row.description, locale),
      seoTitle: textOf(row.seoTitle, locale),
      seoDescription: textOf(row.seoDescription, locale),
    }
  })
}

function mapCollections(rows: StorefrontRows, locale: Locale): CollectionItem[] {
  const galleryByCollection = new Map<string, string[]>()
  for (const image of [...rows.collectionImages].sort(
    (a, b) => a.sortOrder - b.sortOrder
  )) {
    const list = galleryByCollection.get(image.collectionId) ?? []
    list.push(image.url)
    galleryByCollection.set(image.collectionId, list)
  }

  return rows.collections.map((row) => {
    const galleryUrls = (galleryByCollection.get(row.id) ?? []).filter(
      (url) => url !== row.coverUrl
    )

    return {
      name: textOf(row.name, locale, row.slug),
      subtitle: textOf(row.subtitle, locale),
      href: `/catalog/${row.slug}`,
      image: row.coverUrl,
      imageAlt: textOf(row.imageAlt, locale, textOf(row.name, locale, row.slug)),
      galleryUrls,
      year: row.year,
      seoTitle: textOf(row.seoTitle, locale),
      seoDescription: textOf(row.seoDescription, locale),
    }
  })
}

function mapFilterGroups(
  rows: StorefrontRows,
  locale: Locale
): CatalogFilterGroup[] {
  return rows.attributeGroups
    .map((group) => ({
      key: group.slug,
      title: textOf(group.label, locale, group.slug),
      kind: group.kind,
      options: rows.attributes
        .filter((item) => item.groupId === group.id)
        .map((item) => ({
          value: item.slug,
          label: textOf(item.label, locale, item.slug),
        })),
    }))
    .filter((group) => group.options.length > 0)
}

function mapBlogPosts(
  rows: StorefrontRows,
  locale: Locale
): StorefrontBlogPost[] {
  return rows.posts.map((row) => ({
    slug: row.slug,
    title: textOf(row.title, locale, row.slug),
    date: formatBlogDate(row.publishedAt, locale),
    image: row.coverUrl,
    imageAlt: textOf(row.imageAlt, locale, textOf(row.title, locale, row.slug)),
    excerpt: textOf(row.excerpt, locale),
    content: textOf(row.content, locale),
    seoTitle: textOf(row.seoTitle, locale),
    seoDescription: textOf(row.seoDescription, locale),
  }))
}

function testimonialMeta(locale: Locale, gown: string, year: number | null) {
  const gownLabel = locale === "vi" ? "Váy" : "Gown"
  const yearLabel = locale === "vi" ? "Năm" : "Year"
  const meta: { label: string; value: string }[] = []
  if (gown) meta.push({ label: gownLabel, value: gown })
  if (year) meta.push({ label: yearLabel, value: String(year) })
  return meta
}

function mapTestimonials(
  rows: StorefrontRows,
  locale: Locale,
  dict: Dictionary
) {
  const copy = copyRecord(rows.copy["home.testimonials"])
  return {
    label: copyText(copy.label, locale, dict.home.testimonials.label),
    title: copyText(copy.title, locale, dict.home.testimonials.title),
    items: rows.testimonials.map((row) => ({
      name: row.name,
      quote: textOf(row.quote, locale),
      image: row.imageUrl,
      imageAlt: textOf(row.imageAlt, locale, row.name),
      meta: testimonialMeta(locale, row.gown, row.year),
    })),
  }
}

function mapHero(rows: StorefrontRows, locale: Locale, dict: Dictionary): StorefrontHero {
  const copy = copyRecord(rows.copy["home.hero"])
  return {
    headline: copyText(copy.headline, locale, dict.home.headline),
    subhead: copyText(copy.subhead, locale, dict.home.subhead),
    description: copyText(copy.description, locale, dict.home.description),
    cta: copyText(copy.cta, locale, dict.home.cta),
    imageAlt: copyText(copy.image_alt, locale, dict.home.imageAlt),
    imageUrl: copyText(copy.image_url, locale, "/hero/bridal.webp"),
  }
}

function mapAbout(rows: StorefrontRows, locale: Locale, dict: Dictionary) {
  const copy = copyRecord(rows.copy["home.about"])
  const fallback = dict.home.about
  const stepsValue = Array.isArray(copy.steps) ? copy.steps : []

  return {
    label: copyText(copy.label, locale, fallback.label),
    headline: copyText(copy.headline, locale, fallback.headline),
    body: copyText(copy.body, locale, fallback.body),
    steps: fallback.steps.map((step, index) => {
      const item = copyRecord(stepsValue[index])
      return {
        number: typeof item.number === "string" ? item.number : step.number,
        title: copyText(item.title, locale, step.title),
        body: copyText(item.body, locale, step.body),
      }
    }),
  }
}

function mapProductPageCopy(rows: StorefrontRows, locale: Locale, dict: Dictionary) {
  const care = copyRecord(rows.copy["product.care"])
  const shipping = copyRecord(rows.copy["product.shipping"])
  const madeToMeasure = copyRecord(rows.copy["product.madeToMeasure"])

  return {
    ...dict.productPage,
    careTitle: copyText(care.title, locale, dict.productPage.careTitle),
    care: copyText(care.body, locale, dict.productPage.care),
    shippingTitle: copyText(shipping.title, locale, dict.productPage.shippingTitle),
    shipping: copyText(shipping.body, locale, dict.productPage.shipping),
    madeToMeasureTitle: copyText(
      madeToMeasure.title,
      locale,
      dict.productPage.madeToMeasureTitle
    ),
    madeToMeasure: copyText(
      madeToMeasure.body,
      locale,
      dict.productPage.madeToMeasure
    ),
    lead: copyText(rows.copy["product.lead"], locale, dict.productPage.lead),
    body: copyText(rows.copy["product.body"], locale, dict.productPage.body),
  }
}

const loadStorefrontRows = cache(async () => {
  const visibility = isLiveProduct()
  const postVisibility = isLivePost()

  const [
    products,
    productImages,
    productCollections,
    productAttributes,
    collections,
    collectionImages,
    attributeGroups,
    attributes,
    posts,
    testimonials,
    copyRows,
  ] = await Promise.all([
    db
      .select()
      .from(product)
      .where(visibility)
      .orderBy(asc(product.sortOrder), asc(product.sortNumber), asc(product.name)),
    db.select().from(productImage),
    db
      .select({
        productId: productCollection.productId,
        slug: collection.slug,
      })
      .from(productCollection)
      .innerJoin(collection, eq(productCollection.collectionId, collection.id)),
    db
      .select({
        productId: productAttribute.productId,
        slug: catalogAttribute.slug,
        groupSlug: attributeGroup.slug,
      })
      .from(productAttribute)
      .innerJoin(
        catalogAttribute,
        eq(productAttribute.attributeId, catalogAttribute.id)
      )
      .innerJoin(attributeGroup, eq(catalogAttribute.groupId, attributeGroup.id)),
    db
      .select()
      .from(collection)
      .where(isLiveCollection())
      .orderBy(asc(collection.sortOrder), asc(collection.slug)),
    db.select().from(collectionImage),
    db
      .select()
      .from(attributeGroup)
      .orderBy(asc(attributeGroup.sortOrder), asc(attributeGroup.slug)),
    db
      .select()
      .from(catalogAttribute)
      .orderBy(asc(catalogAttribute.sortOrder), asc(catalogAttribute.slug)),
    db
      .select()
      .from(blogPost)
      .where(postVisibility)
      .orderBy(desc(blogPost.publishedAt), desc(blogPost.updatedAt)),
    db
      .select()
      .from(testimonial)
      .where(eq(testimonial.status, "published"))
      .orderBy(asc(testimonial.sortOrder), asc(testimonial.name)),
    db.select().from(siteCopy),
  ])

  return {
    products,
    productImages,
    productCollections,
    productAttributes,
    collections,
    collectionImages,
    attributeGroups,
    attributes,
    posts,
    testimonials,
    copy: Object.fromEntries(copyRows.map((row) => [row.key, row.value])),
  }
})

export const getStorefront = cache(async (locale: Locale, dict: Dictionary) => {
  const rows = await loadStorefrontRows()
  const products = mapProducts(rows, locale).filter((item) => item.image)
  const collections = mapCollections(rows, locale).filter((item) => item.image)
  const filterGroups = mapFilterGroups(rows, locale)
  const featuredProducts = products.filter((item) => item.featured)
  const blogPosts = mapBlogPosts(rows, locale)

  return {
    products,
    featuredProducts: featuredProducts.length > 0 ? featuredProducts : products,
    collections,
    filterGroups,
    blogPosts,
    testimonials: mapTestimonials(rows, locale, dict),
    hero: mapHero(rows, locale, dict),
    about: mapAbout(rows, locale, dict),
    collectionTitle: copyText(
      rows.copy["home.collectionTitle"],
      locale,
      dict.home.collection.title
    ),
    featuredTitle: copyText(
      rows.copy["home.featuredTitle"],
      locale,
      dict.home.featured.title
    ),
    blogTitle: copyText(
      rows.copy["home.blogTitle"],
      locale,
      dict.home.blog.title
    ),
    productPage: mapProductPageCopy(rows, locale, dict),
  }
})

export async function getStorefrontCatalogSlugs() {
  const rows = await loadStorefrontRows()
  const slugs = new Set<string>(VIRTUAL_CATALOG_SLUGS)

  for (const item of rows.collections) slugs.add(item.slug)
  for (const item of rows.attributes) slugs.add(item.slug)

  return [...slugs]
}

export async function getStorefrontProductSlugs() {
  const rows = await loadStorefrontRows()
  return rows.products.map((item) => item.slug)
}

export async function getStorefrontBlogSlugs() {
  const rows = await loadStorefrontRows()
  return rows.posts.map((item) => item.slug)
}

export function findStorefrontCollection(
  collections: CollectionItem[],
  slug: string
) {
  return collections.find((item) => item.href === `/catalog/${slug}`)
}

export function catalogTitle(
  slug: string,
  collections: CollectionItem[],
  groups: CatalogFilterGroup[],
  dict: Dictionary
) {
  const collection = findStorefrontCollection(collections, slug)
  if (collection) return collection.name

  for (const group of groups) {
    const option = group.options.find((item) => item.value === slug)
    if (option) return option.label
  }

  const href = `/catalog/${slug}`
  const columns = [
    ...dict.nav.homeColumns,
    ...dict.nav.collectionColumns,
    ...dict.nav.bridalColumns,
    ...dict.nav.aodaiColumns,
  ]
  for (const column of columns) {
    const match = column.links.find((link) => link.href === href)
    if (match) return match.label
  }

  return slug
}

export function storefrontNav(
  nav: Dictionary["nav"],
  collections: CollectionItem[],
  products: CatalogProduct[],
  groups: CatalogFilterGroup[]
): Dictionary["nav"] {
  const collectionColumns = collectionNavColumns(collections, nav.collection)
  const gownGroups = groups.filter((group) => (group.kind ?? "gown") === "gown")
  const aoDaiGroups = groups.filter((group) => group.kind === "ao-dai")
  const allGowns =
    nav.bridalColumns[0]?.links.find((link) =>
      link.href.endsWith("/all-gowns")
    ) ?? { label: "All gowns", href: "/catalog/all-gowns" }
  const allAoDai =
    nav.aodaiColumns[0]?.links.find((link) =>
      link.href.endsWith("/all-ao-dai")
    ) ?? { label: "Tất cả áo dài", href: "/catalog/all-ao-dai" }

  const bridalFromDb = gownGroups.map((group, index) => ({
    title: group.title,
    links: [
      ...(index === 0 ? [allGowns] : []),
      ...group.options.map((option) => ({
        label: option.label,
        href: `/catalog/${option.value}`,
      })),
    ],
  }))

  const extraBridal = nav.bridalColumns.filter((column, index) => {
    if (index < gownGroups.length) return false
    return !gownGroups.some(
      (group) => group.title.toLowerCase() === column.title.toLowerCase()
    )
  })

  const aodaiFromDb = [
    {
      title: nav.aodaiColumns[0]?.title ?? "Áo dài",
      links: [allAoDai],
    },
    ...aoDaiGroups.map((group) => ({
      title: group.title,
      links: group.options.map((option) => ({
        label: option.label,
        href: `/catalog/${option.value}`,
      })),
    })),
  ]

  const featuredLinks = (products.slice(0, 4) ?? []).map((item) => ({
    label: parseProductName(item.name).shortName,
    href: `/product/${productSlug(item)}`,
  }))

  const collectionLinks = collections.slice(0, 4).map((item) => ({
    label: item.name,
    href: item.href,
  }))

  const homeColumns = nav.homeColumns.map((column, index) => {
    if (index === 0 && featuredLinks.length > 0) {
      return { ...column, links: featuredLinks }
    }
    if (index === 1 && collectionLinks.length > 0) {
      return { ...column, links: collectionLinks }
    }
    return column
  })

  return {
    ...nav,
    homeColumns,
    collectionColumns:
      collectionColumns.length > 0 ? collectionColumns : nav.collectionColumns,
    bridalColumns:
      bridalFromDb.length > 0
        ? [...bridalFromDb, ...extraBridal]
        : nav.bridalColumns,
    aodaiColumns: aoDaiGroups.length > 0 ? aodaiFromDb : nav.aodaiColumns,
  }
}

function collectionNavColumns(
  collections: CollectionItem[],
  fallbackTitle: string
) {
  const grouped = new Map<string, CollectionItem[]>()

  for (const item of collections) {
    const key = item.year ? String(item.year) : fallbackTitle
    const list = grouped.get(key) ?? []
    list.push(item)
    grouped.set(key, list)
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => Number(b) - Number(a) || a.localeCompare(b))
    .map(([title, items]) => ({
      title,
      links: items.map((item) => ({
        label: item.name,
        href: item.href,
      })),
    }))
}

export function withStorefrontContact(
  dict: Dictionary,
  settings: SiteSettings,
  locale: Locale
) {
  const address = localizedValue(
    { vi: settings.address.vi, en: settings.address.en },
    locale
  )
  const brandName = settings.business.brandName || dict.brand.name

  return {
    brand: {
      ...dict.brand,
      name: brandName,
    },
    footer: {
      ...dict.footer,
      company: {
        ...dict.footer.company,
        name: brandName,
        address: address || dict.footer.company.address,
        phone: settings.contact.hotline || dict.footer.company.phone,
        email: settings.contact.email || dict.footer.company.email,
        legalName: settings.business.legalName || dict.footer.company.legalName,
        taxCode: settings.business.taxCode || dict.footer.company.taxCode,
        representative:
          settings.business.representative || dict.footer.company.representative,
        licenseNumber:
          settings.business.licenseNumber || dict.footer.company.licenseNumber,
        workingHours:
          localizedValue(settings.business.workingHours, locale) ||
          dict.footer.company.workingHours,
      },
      mapQuery: settings.address.mapQuery || dict.footer.mapQuery,
      address: address || dict.footer.address,
    },
    social: {
      ...dict.social,
      facebookUrl: settings.social.facebookUrl,
      instagramUrl: settings.social.instagramUrl,
      zaloPhone: settings.contact.zalo || dict.social.zaloPhone,
    },
    storeAddress: address || dict.footer.company.address,
  }
}

export const getStorefrontContact = cache(async (locale: Locale, dict: Dictionary) => {
  const settings = await getSiteSettings()
  return withStorefrontContact(dict, settings, locale)
})
