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
import { db } from "@/lib/db"
import {
  jsonLocalizedContains,
  textContains,
  yearContains,
} from "@/lib/db/search-sql"
import {
  likePattern,
  paginateMeta,
  type AdminPageResult,
} from "@/lib/admin-pagination"
import {
  attributeGroup,
  blogCategory,
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
import type { LocalizedText } from "@/lib/site-settings"
import { localizedValue } from "@/lib/site-settings"
import {
  adminListStatusCondition,
  type ContentStatus,
} from "@/lib/content-schedule"
import { contentAppearance, toContentStatus } from "@/lib/content-status"
import type { AdminBlogListItem } from "@/lib/admin-blog"
import type { AdminCollectionListItem } from "@/lib/admin-collections"
import type { AdminProductListItem, ProductKind } from "@/lib/admin-products"
import type {
  AdminTestimonial,
  TestimonialsSectionCopy,
} from "@/lib/admin-testimonials"

function textOf(value: LocalizedText | null | undefined) {
  return localizedValue(value ?? { vi: "", en: "" }, "vi")
}

function asLocalized(value: LocalizedText | null | undefined): LocalizedText {
  return { vi: value?.vi ?? "", en: value?.en ?? "" }
}

export type AdminAttributeOption = {
  id: string
  slug: string
  label: string
  labelVi: string
  labelEn: string
  sortOrder: number
}

export type AdminAttributeGroupOption = {
  id: string
  slug: string
  label: string
  labelVi: string
  labelEn: string
  selection: "single" | "multiple"
  kind: ProductKind
  sortOrder: number
  attributes: AdminAttributeOption[]
}

export type AdminCollectionOption = {
  id: string
  slug: string
  name: string
}

export type AdminProductRecord = {
  id: string
  slug: string
  name: string
  code: string
  fullTitle: string
  description: LocalizedText
  tags: string[]
  priceVnd: number | null
  priceDisplay: AdminProductListItem["priceDisplay"]
  kind: ProductKind
  status: ContentStatus
  publishedAt: string | null
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  imageUrls: string[]
  attributeIds: string[]
  collectionIds: string[]
}

export type AdminCollectionRecord = {
  id: string
  slug: string
  year: number | null
  name: LocalizedText
  subtitle: LocalizedText
  imageAlt: LocalizedText
  coverUrl: string
  galleryUrls: string[]
  status: ContentStatus
  publishedAt: string | null
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export type AdminBlogRecord = {
  id: string
  slug: string
  categoryId: string
  categoryLabel: string
  title: LocalizedText
  excerpt: LocalizedText
  content: LocalizedText
  imageAlt: LocalizedText
  coverUrl: string
  status: ContentStatus
  publishedAt: string | null
  seoTitle: string
  seoDescription: string
  seoKeywords: string
}

export type AdminBlogCategoryOption = {
  id: string
  slug: string
  label: string
}

export async function listAdminAttributeGroups(): Promise<
  AdminAttributeGroupOption[]
> {
  const groups = await db
    .select()
    .from(attributeGroup)
    .orderBy(asc(attributeGroup.sortOrder), asc(attributeGroup.slug))
  const attributes = await db
    .select()
    .from(catalogAttribute)
    .orderBy(asc(catalogAttribute.sortOrder), asc(catalogAttribute.slug))

  return groups.map((group) => ({
    id: group.id,
    slug: group.slug,
    label: textOf(group.label),
    labelVi: group.label.vi,
    labelEn: group.label.en,
    selection: group.selection,
    kind: group.kind,
    sortOrder: group.sortOrder,
    attributes: attributes
      .filter((item) => item.groupId === group.id)
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        label: textOf(item.label),
        labelVi: item.label.vi,
        labelEn: item.label.en,
        sortOrder: item.sortOrder,
      })),
  }))
}

export async function listAdminCollectionOptions(): Promise<
  AdminCollectionOption[]
> {
  const rows = await db
    .select({
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
    })
    .from(collection)
    .orderBy(asc(collection.sortOrder), asc(collection.slug))

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: textOf(row.name),
  }))
}

export type AdminProductListQuery = {
  q?: string
  page?: number
  kind?: string
  status?: string
  collection?: string
  category?: string
}

function productInCollectionSlug(slug: string) {
  return exists(
    db
      .select({ productId: productCollection.productId })
      .from(productCollection)
      .innerJoin(collection, eq(productCollection.collectionId, collection.id))
      .where(
        and(
          eq(productCollection.productId, product.id),
          eq(collection.slug, slug)
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

export async function listAdminProductCategoryOptions(kind?: string) {
  const groupSlug =
    kind === "ao-dai" ? "ao-dai-color" : kind === "gown" ? "silhouette" : null
  const rows = await db
    .select({
      slug: catalogAttribute.slug,
      label: catalogAttribute.label,
    })
    .from(catalogAttribute)
    .innerJoin(attributeGroup, eq(catalogAttribute.groupId, attributeGroup.id))
    .where(
      groupSlug
        ? eq(attributeGroup.slug, groupSlug)
        : inArray(attributeGroup.slug, ["silhouette", "ao-dai-color"])
    )
    .orderBy(asc(attributeGroup.sortOrder), asc(catalogAttribute.sortOrder))

  return rows.map((row) => ({
    value: row.slug,
    label: textOf(row.label),
  }))
}

export async function listAdminProducts(
  query: AdminProductListQuery = {}
): Promise<AdminPageResult<AdminProductListItem>> {
  const q = query.q?.trim() ?? ""
  const conditions: SQL[] = []

  if (query.kind === "gown" || query.kind === "ao-dai") {
    conditions.push(eq(product.kind, query.kind))
  }
  const statusFilter = adminListStatusCondition(
    product.status,
    product.publishedAt,
    query.status
  )
  if (statusFilter) conditions.push(statusFilter)
  if (q) {
    const pattern = likePattern(q)
    conditions.push(
      or(
        textContains(product.name, pattern),
        textContains(product.code, pattern),
        textContains(product.fullTitle, pattern),
        textContains(product.slug, pattern)
      )!
    )
  }
  if (query.collection) {
    conditions.push(productInCollectionSlug(query.collection))
  }
  if (query.category) {
    conditions.push(productHasAttributeSlug(query.category))
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const [countRow] = await db
    .select({ total: count() })
    .from(product)
    .where(where)
  const meta = paginateMeta(Number(countRow?.total ?? 0), query.page ?? 1)
  const rows = await db
    .select()
    .from(product)
    .where(where)
    .orderBy(asc(product.sortOrder), asc(product.sortNumber), asc(product.name))
    .limit(meta.pageSize)
    .offset(meta.offset)

  const ids = rows.map((row) => row.id)
  const [images, collections, attributes] = ids.length
    ? await Promise.all([
        db
          .select()
          .from(productImage)
          .where(inArray(productImage.productId, ids)),
        db
          .select({
            productId: productCollection.productId,
            name: collection.name,
          })
          .from(productCollection)
          .innerJoin(
            collection,
            eq(productCollection.collectionId, collection.id)
          )
          .where(inArray(productCollection.productId, ids)),
        db
          .select({
            productId: productAttribute.productId,
            groupSlug: attributeGroup.slug,
            label: catalogAttribute.label,
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
    : [[], [], []]

  const items = rows.map((row) => {
    const image =
      images
        .filter((item) => item.productId === row.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url ?? ""
    const silhouette = attributes.find(
      (item) => item.productId === row.id && item.groupSlug === "silhouette"
    )
    const aoDaiColor = attributes.find(
      (item) => item.productId === row.id && item.groupSlug === "ao-dai-color"
    )
    const category =
      row.kind === "ao-dai"
        ? aoDaiColor
          ? textOf(aoDaiColor.label)
          : "—"
        : silhouette
          ? textOf(silhouette.label)
          : "—"

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      fullName: [row.name, row.code, row.fullTitle].filter(Boolean).join(" — "),
      code: row.code,
      image,
      price: row.priceVnd,
      priceDisplay: row.priceDisplay,
      kind: row.kind,
      category,
      collections: collections
        .filter((item) => item.productId === row.id)
        .map((item) => textOf(item.name)),
      status: contentAppearance(row.status, row.publishedAt),
      publishedAt: row.publishedAt?.toISOString() ?? null,
    }
  })

  return { items, ...meta }
}

export async function getAdminProduct(
  slug: string
): Promise<AdminProductRecord | null> {
  const [row] = await db
    .select()
    .from(product)
    .where(eq(product.slug, slug))
    .limit(1)
  if (!row) return null

  const images = await db
    .select()
    .from(productImage)
    .where(eq(productImage.productId, row.id))
    .orderBy(asc(productImage.sortOrder))
  const attributeRows = await db
    .select({ attributeId: productAttribute.attributeId })
    .from(productAttribute)
    .where(eq(productAttribute.productId, row.id))
  const collectionRows = await db
    .select({ collectionId: productCollection.collectionId })
    .from(productCollection)
    .where(eq(productCollection.productId, row.id))

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    code: row.code,
    fullTitle: row.fullTitle,
    description: asLocalized(row.description),
    tags: row.tags ?? [],
    priceVnd: row.priceVnd,
    priceDisplay: row.priceDisplay,
    kind: row.kind,
    status: toContentStatus(row.status),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    seoTitle: row.seoTitle.vi,
    seoDescription: row.seoDescription.vi,
    seoKeywords: row.seoKeywords.vi,
    imageUrls: images.map((item) => item.url),
    attributeIds: attributeRows.map((item) => item.attributeId),
    collectionIds: collectionRows.map((item) => item.collectionId),
  }
}

export type AdminCollectionListQuery = {
  q?: string
  page?: number
  status?: string
}

export async function listAdminCollections(
  query: AdminCollectionListQuery = {}
): Promise<AdminPageResult<AdminCollectionListItem>> {
  const q = query.q?.trim() ?? ""
  const conditions: SQL[] = []

  const statusFilter = adminListStatusCondition(
    collection.status,
    collection.publishedAt,
    query.status
  )
  if (statusFilter) conditions.push(statusFilter)
  if (q) {
    const pattern = likePattern(q)
    conditions.push(
      or(
        jsonLocalizedContains(collection.name, pattern),
        jsonLocalizedContains(collection.subtitle, pattern),
        textContains(collection.slug, pattern)
      )!
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const [countRow] = await db
    .select({ total: count() })
    .from(collection)
    .where(where)
  const meta = paginateMeta(Number(countRow?.total ?? 0), query.page ?? 1)
  const rows = await db
    .select()
    .from(collection)
    .where(where)
    .orderBy(asc(collection.sortOrder), asc(collection.slug))
    .limit(meta.pageSize)
    .offset(meta.offset)

  const ids = rows.map((row) => row.id)
  const counts = ids.length
    ? await db
        .select({
          collectionId: productCollection.collectionId,
          value: count(),
        })
        .from(productCollection)
        .where(inArray(productCollection.collectionId, ids))
        .groupBy(productCollection.collectionId)
    : []
  const countMap = new Map(
    counts.map((item) => [item.collectionId, Number(item.value)])
  )

  return {
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: textOf(row.name),
      subtitle: textOf(row.subtitle),
      image: row.coverUrl,
      imageAlt: textOf(row.imageAlt),
      productCount: countMap.get(row.id) ?? 0,
      status: contentAppearance(row.status, row.publishedAt),
      publishedAt: row.publishedAt?.toISOString() ?? null,
    })),
    ...meta,
  }
}

export async function getAdminCollection(
  slug: string
): Promise<AdminCollectionRecord | null> {
  const [row] = await db
    .select()
    .from(collection)
    .where(eq(collection.slug, slug))
    .limit(1)
  if (!row) return null

  const images = await db
    .select()
    .from(collectionImage)
    .where(eq(collectionImage.collectionId, row.id))
    .orderBy(asc(collectionImage.sortOrder))
  const galleryUrls = images
    .map((item) => item.url)
    .filter((url) => url !== row.coverUrl)

  return {
    id: row.id,
    slug: row.slug,
    year: row.year,
    name: asLocalized(row.name),
    subtitle: asLocalized(row.subtitle),
    imageAlt: asLocalized(row.imageAlt),
    coverUrl: row.coverUrl,
    galleryUrls,
    status: toContentStatus(row.status),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    seoTitle: row.seoTitle.vi,
    seoDescription: row.seoDescription.vi,
    seoKeywords: row.seoKeywords.vi,
  }
}

export async function listAdminBlogCategories(): Promise<
  AdminBlogCategoryOption[]
> {
  const rows = await db
    .select()
    .from(blogCategory)
    .orderBy(asc(blogCategory.slug))

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    label: textOf(row.label),
  }))
}

export type AdminBlogListQuery = {
  q?: string
  page?: number
  status?: string
  category?: string
}

export async function listAdminBlogPosts(
  query: AdminBlogListQuery = {}
): Promise<AdminPageResult<AdminBlogListItem>> {
  const q = query.q?.trim() ?? ""
  const conditions: SQL[] = []

  const statusFilter = adminListStatusCondition(
    blogPost.status,
    blogPost.publishedAt,
    query.status
  )
  if (statusFilter) conditions.push(statusFilter)
  if (query.category) {
    conditions.push(eq(blogCategory.slug, query.category))
  }
  if (q) {
    const pattern = likePattern(q)
    conditions.push(
      or(
        jsonLocalizedContains(blogPost.title, pattern),
        textContains(blogPost.slug, pattern),
        jsonLocalizedContains(blogCategory.label, pattern)
      )!
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const [countRow] = await db
    .select({ total: count() })
    .from(blogPost)
    .innerJoin(blogCategory, eq(blogPost.categoryId, blogCategory.id))
    .where(where)
  const meta = paginateMeta(Number(countRow?.total ?? 0), query.page ?? 1)
  const rows = await db
    .select({
      id: blogPost.id,
      slug: blogPost.slug,
      title: blogPost.title,
      coverUrl: blogPost.coverUrl,
      status: blogPost.status,
      publishedAt: blogPost.publishedAt,
      categoryLabel: blogCategory.label,
    })
    .from(blogPost)
    .innerJoin(blogCategory, eq(blogPost.categoryId, blogCategory.id))
    .where(where)
    .orderBy(desc(blogPost.updatedAt))
    .limit(meta.pageSize)
    .offset(meta.offset)

  return {
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: textOf(row.title),
      thumbnail: row.coverUrl,
      category: textOf(row.categoryLabel),
      status: contentAppearance(row.status, row.publishedAt),
      publishedAt: row.publishedAt?.toISOString() ?? null,
    })),
    ...meta,
  }
}

export async function getAdminBlogPost(
  slug: string
): Promise<AdminBlogRecord | null> {
  const [row] = await db
    .select({
      post: blogPost,
      categoryLabel: blogCategory.label,
    })
    .from(blogPost)
    .innerJoin(blogCategory, eq(blogPost.categoryId, blogCategory.id))
    .where(eq(blogPost.slug, slug))
    .limit(1)

  if (!row) return null

  return {
    id: row.post.id,
    slug: row.post.slug,
    categoryId: row.post.categoryId,
    categoryLabel: textOf(row.categoryLabel),
    title: asLocalized(row.post.title),
    excerpt: asLocalized(row.post.excerpt),
    content: asLocalized(row.post.content),
    imageAlt: asLocalized(row.post.imageAlt),
    coverUrl: row.post.coverUrl,
    status: toContentStatus(row.post.status),
    publishedAt: row.post.publishedAt?.toISOString() ?? null,
    seoTitle: row.post.seoTitle.vi,
    seoDescription: row.post.seoDescription.vi,
    seoKeywords: row.post.seoKeywords.vi,
  }
}

export type AdminTestimonialListQuery = {
  q?: string
  page?: number
  status?: string
  year?: string
}

export async function listAdminTestimonialYears() {
  const rows = await db
    .selectDistinct({ year: testimonial.year })
    .from(testimonial)
    .where(sql`${testimonial.year} is not null`)
    .orderBy(desc(testimonial.year))

  return rows
    .map((row) => row.year)
    .filter((year): year is number => year != null)
    .map(String)
}

export async function listAdminTestimonials(
  query: AdminTestimonialListQuery = {}
): Promise<AdminPageResult<AdminTestimonial>> {
  const q = query.q?.trim() ?? ""
  const conditions: SQL[] = []

  if (query.status === "published" || query.status === "draft") {
    conditions.push(eq(testimonial.status, query.status))
  }
  const year = Number.parseInt(query.year ?? "", 10)
  if (Number.isFinite(year) && year > 0) {
    conditions.push(eq(testimonial.year, year))
  }
  if (q) {
    const pattern = likePattern(q)
    conditions.push(
      or(
        textContains(testimonial.name, pattern),
        jsonLocalizedContains(testimonial.quote, pattern),
        textContains(testimonial.gown, pattern),
        textContains(testimonial.slug, pattern),
        yearContains(testimonial.year, pattern)
      )!
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const [countRow] = await db
    .select({ total: count() })
    .from(testimonial)
    .where(where)
  const meta = paginateMeta(Number(countRow?.total ?? 0), query.page ?? 1)
  const rows = await db
    .select()
    .from(testimonial)
    .where(where)
    .orderBy(asc(testimonial.sortOrder), asc(testimonial.name))
    .limit(meta.pageSize)
    .offset(meta.offset)

  return {
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      quoteVi: row.quote.vi,
      quoteEn: row.quote.en,
      image: row.imageUrl,
      imageAltVi: row.imageAlt.vi,
      imageAltEn: row.imageAlt.en,
      gown: row.gown,
      year: row.year ? String(row.year) : "",
      status: row.status === "draft" ? "draft" : "published",
    })),
    ...meta,
  }
}

export async function getAdminTestimonialRecord(slug: string) {
  const [row] = await db
    .select()
    .from(testimonial)
    .where(eq(testimonial.slug, slug))
    .limit(1)
  return row ?? null
}

export async function getAdminTestimonial(
  slug: string
): Promise<AdminTestimonial | null> {
  const row = await getAdminTestimonialRecord(slug)
  if (!row) return null

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    quoteVi: row.quote.vi,
    quoteEn: row.quote.en,
    image: row.imageUrl,
    imageAltVi: row.imageAlt.vi,
    imageAltEn: row.imageAlt.en,
    gown: row.gown,
    year: row.year ? String(row.year) : "",
    status: row.status === "draft" ? "draft" : "published",
  }
}

export async function getTestimonialsSectionCopy(): Promise<TestimonialsSectionCopy> {
  const [row] = await db
    .select()
    .from(siteCopy)
    .where(eq(siteCopy.key, "home.testimonials"))
    .limit(1)

  const value = (row?.value ?? {}) as {
    label?: LocalizedText
    title?: LocalizedText
  }

  return {
    labelVi: value.label?.vi ?? "",
    labelEn: value.label?.en ?? "",
    titleVi: value.title?.vi ?? "",
    titleEn: value.title?.en ?? "",
  }
}
