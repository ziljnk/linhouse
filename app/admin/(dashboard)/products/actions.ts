"use server"

import { asc, eq, inArray, max } from "drizzle-orm"
import {
  actionFail,
  actionOk,
  revalidateAdmin,
  requireSlug,
  toLocalized,
  type ActionResult,
} from "@/lib/admin-actions"
import { recordAudit } from "@/lib/admin-audit"
import {
  auditStatusLabel,
  deletedChange,
  diffFields,
  formatAuditDate,
  joinAuditList,
  localizedChanges,
} from "@/lib/admin-audit-shared"
import {
  PRICE_DISPLAY_LABELS,
  PRODUCT_KIND_LABELS,
  PRODUCT_PURCHASE_OPTION_LABELS,
} from "@/lib/admin-products"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { db } from "@/lib/db"
import {
  attributeGroup,
  catalogAttribute,
  collection,
  product,
  productAttribute,
  productCollection,
  productImage,
} from "@/lib/db/schema"
import type { PriceDisplay, ProductKind } from "@/lib/admin-products"
import {
  parsePurchaseOptions,
  type ProductPurchaseOption,
} from "@/lib/catalog"
import {
  resolvePublishFields,
  type PublishIntent,
} from "@/lib/content-schedule"
import { sanitizePlainText } from "@/lib/sanitize-content"
import { sanitizeMediaUrls } from "@/lib/sanitize-url"
import { cleanupRemovedCmsImages } from "@/lib/cms-image-storage"

export type ProductInput = {
  name: string
  code?: string
  slug: string
  descriptionVi?: string
  descriptionEn?: string
  attributeIds?: string[]
  collectionIds?: string[]
  tags?: string[]
  purchaseOptions?: ProductPurchaseOption[]
  imageUrls?: string[]
  priceVnd?: number | null
  priceDisplay?: PriceDisplay
  kind?: ProductKind
  isOld?: boolean
  intent: PublishIntent
  publishedAt?: string | null
  seoTitleVi?: string
  seoTitleEn?: string
  seoDescriptionVi?: string
  seoDescriptionEn?: string
  seoKeywordsVi?: string
  seoKeywordsEn?: string
}

async function nextSortNumber() {
  const [row] = await db.select({ value: max(product.sortNumber) }).from(product)
  return (row?.value ?? 0) + 1
}

async function attributeIdsForKind(ids: string[], kind: ProductKind) {
  if (!ids.length) return []

  const rows = await db
    .select({
      id: catalogAttribute.id,
      kind: attributeGroup.kind,
    })
    .from(catalogAttribute)
    .innerJoin(attributeGroup, eq(catalogAttribute.groupId, attributeGroup.id))
    .where(inArray(catalogAttribute.id, ids))

  return rows.filter((row) => row.kind === kind).map((row) => row.id)
}

async function replaceJoins(
  productId: string,
  attributeIds: string[],
  collectionIds: string[],
  imageUrls: string[]
) {
  await db.delete(productAttribute).where(eq(productAttribute.productId, productId))
  if (attributeIds.length) {
    await db.insert(productAttribute).values(
      [...new Set(attributeIds)].map((attributeId) => ({
        productId,
        attributeId,
      }))
    )
  }

  await db.delete(productCollection).where(eq(productCollection.productId, productId))
  if (collectionIds.length) {
    await db.insert(productCollection).values(
      [...new Set(collectionIds)].map((collectionId) => ({
        productId,
        collectionId,
      }))
    )
  }

  const previous = await db
    .select({ url: productImage.url })
    .from(productImage)
    .where(eq(productImage.productId, productId))

  await db.delete(productImage).where(eq(productImage.productId, productId))
  if (imageUrls.length) {
    await db.insert(productImage).values(
      imageUrls.map((url, index) => ({
        productId,
        url,
        sortOrder: index,
      }))
    )
  }

  await cleanupRemovedCmsImages(
    previous.map((row) => row.url),
    imageUrls
  )
}

function catalogPathForKind(kind: ProductKind) {
  return kind === "ao-dai" ? "/catalog/all-ao-dai" : "/catalog/all-gowns"
}

function productStorefrontPaths(input: {
  slugs: string[]
  kinds: ProductKind[]
  catalogSlugs: string[]
}) {
  const paths = ["/", ...input.kinds.map(catalogPathForKind)]
  for (const slug of input.slugs) {
    if (slug) paths.push(`/product/${slug}`)
  }
  for (const slug of input.catalogSlugs) {
    if (slug) paths.push(`/catalog/${slug}`)
  }
  return paths
}

async function catalogSlugsForIds(
  collectionIds: string[],
  attributeIds: string[]
) {
  const collectionSlugs: string[] = []
  const attributeSlugs: string[] = []

  if (collectionIds.length) {
    const rows = await db
      .select({ slug: collection.slug })
      .from(collection)
      .where(inArray(collection.id, collectionIds))
    collectionSlugs.push(...rows.map((row) => row.slug))
  }

  if (attributeIds.length) {
    const rows = await db
      .select({ slug: catalogAttribute.slug })
      .from(catalogAttribute)
      .where(inArray(catalogAttribute.id, attributeIds))
    attributeSlugs.push(...rows.map((row) => row.slug))
  }

  return [...collectionSlugs, ...attributeSlugs]
}

async function loadProductStorefrontContext(ids: string[]) {
  if (!ids.length) {
    return { slugs: [] as string[], kinds: [] as ProductKind[], catalogSlugs: [] as string[] }
  }

  const [products, collections, attributes] = await Promise.all([
    db
      .select({ slug: product.slug, kind: product.kind })
      .from(product)
      .where(inArray(product.id, ids)),
    db
      .select({ slug: collection.slug })
      .from(productCollection)
      .innerJoin(collection, eq(productCollection.collectionId, collection.id))
      .where(inArray(productCollection.productId, ids)),
    db
      .select({ slug: catalogAttribute.slug })
      .from(productAttribute)
      .innerJoin(
        catalogAttribute,
        eq(productAttribute.attributeId, catalogAttribute.id)
      )
      .where(inArray(productAttribute.productId, ids)),
  ])

  return {
    slugs: products.map((row) => row.slug),
    kinds: products.map((row) => row.kind),
    catalogSlugs: [
      ...collections.map((row) => row.slug),
      ...attributes.map((row) => row.slug),
    ],
  }
}

function validateProduct(input: ProductInput) {
  if (!sanitizePlainText(input.name)) {
    return actionFail("Vui lòng nhập tên sản phẩm.")
  }
  const imageUrls = sanitizeMediaUrls(input.imageUrls ?? [])
  if (input.intent !== "draft" && !imageUrls.length) {
    return actionFail("Vui lòng tải lên ít nhất một ảnh sản phẩm.")
  }
  const priceDisplay = input.priceDisplay ?? "contact"
  if (priceDisplay === "amount" && (input.priceVnd == null || input.priceVnd <= 0)) {
    return actionFail("Vui lòng nhập giá sản phẩm.")
  }
  const slugResult = requireSlug(input.slug)
  if (!slugResult.ok) return slugResult
  return {
    ok: true as const,
    slug: slugResult.slug,
    priceDisplay,
    imageUrls,
  }
}

type ProductAuditSnapshot = {
  name: string
  code: string
  slug: string
  description: { vi: string; en: string }
  priceVnd: number | null
  priceDisplay: PriceDisplay
  kind: ProductKind
  isOld: boolean
  status: string
  publishedAt: Date | null
  tags: string[]
  purchaseOptions: ProductPurchaseOption[]
  imageUrls: string[]
  attributeLabels: string[]
  collectionNames: string[]
  seoTitle: { vi: string; en: string }
  seoDescription: { vi: string; en: string }
  seoKeywords: { vi: string; en: string }
}

function sortedLabels(values: string[]) {
  return joinAuditList([...values].sort((left, right) => left.localeCompare(right, "vi")))
}

function productAuditChanges(
  before: ProductAuditSnapshot | null,
  after: ProductAuditSnapshot
) {
  return diffFields([
    { label: "Tên", before: before?.name ?? "", after: after.name },
    { label: "Mã", before: before?.code ?? "", after: after.code },
    { label: "Đường dẫn", before: before?.slug ?? "", after: after.slug },
    ...localizedChanges("Mô tả", before?.description, after.description),
    { label: "Giá", before: before?.priceVnd ?? "", after: after.priceVnd ?? "" },
    {
      label: "Cách hiện giá",
      before: before ? PRICE_DISPLAY_LABELS[before.priceDisplay] : "",
      after: PRICE_DISPLAY_LABELS[after.priceDisplay],
    },
    {
      label: "Loại",
      before: before ? PRODUCT_KIND_LABELS[before.kind] : "",
      after: PRODUCT_KIND_LABELS[after.kind],
    },
    {
      label: "Mẫu cũ",
      before: before ? (before.isOld ? "Có" : "Không") : "",
      after: after.isOld ? "Có" : "Không",
    },
    {
      label: "Trạng thái",
      before: before ? auditStatusLabel(before.status, before.publishedAt) : "",
      after: auditStatusLabel(after.status, after.publishedAt),
    },
    {
      label: "Thời điểm đăng",
      before: before ? formatAuditDate(before.publishedAt) : "",
      after: formatAuditDate(after.publishedAt),
    },
    {
      label: "Thẻ",
      before: before ? joinAuditList(before.tags) : "",
      after: joinAuditList(after.tags),
    },
    {
      label: "Hình thức mua",
      before: before
        ? joinAuditList(
            before.purchaseOptions.map((item) => PRODUCT_PURCHASE_OPTION_LABELS[item])
          )
        : "",
      after: joinAuditList(
        after.purchaseOptions.map((item) => PRODUCT_PURCHASE_OPTION_LABELS[item])
      ),
    },
    {
      label: "Ảnh",
      before: before ? joinAuditList(before.imageUrls) : "",
      after: joinAuditList(after.imageUrls),
      images: true,
    },
    {
      label: "Danh mục",
      before: before ? sortedLabels(before.attributeLabels) : "",
      after: sortedLabels(after.attributeLabels),
    },
    {
      label: "Bộ sưu tập",
      before: before ? sortedLabels(before.collectionNames) : "",
      after: sortedLabels(after.collectionNames),
    },
    ...localizedChanges("Tiêu đề SEO", before?.seoTitle, after.seoTitle),
    ...localizedChanges("Mô tả SEO", before?.seoDescription, after.seoDescription),
    ...localizedChanges("Từ khóa SEO", before?.seoKeywords, after.seoKeywords),
  ])
}

async function attributeLabels(ids: string[]) {
  if (!ids.length) return []
  const rows = await db
    .select({ label: catalogAttribute.label })
    .from(catalogAttribute)
    .where(inArray(catalogAttribute.id, ids))
  return rows.map((row) => row.label.vi || row.label.en)
}

async function collectionNames(ids: string[]) {
  if (!ids.length) return []
  const rows = await db
    .select({ name: collection.name })
    .from(collection)
    .where(inArray(collection.id, ids))
  return rows.map((row) => row.name.vi || row.name.en)
}

async function loadProductAuditState(id: string): Promise<ProductAuditSnapshot | null> {
  const [row] = await db.select().from(product).where(eq(product.id, id)).limit(1)
  if (!row) return null

  const [images, attributes, collections] = await Promise.all([
    db
      .select({ url: productImage.url })
      .from(productImage)
      .where(eq(productImage.productId, id))
      .orderBy(asc(productImage.sortOrder)),
    db
      .select({ label: catalogAttribute.label })
      .from(productAttribute)
      .innerJoin(catalogAttribute, eq(productAttribute.attributeId, catalogAttribute.id))
      .where(eq(productAttribute.productId, id)),
    db
      .select({ name: collection.name })
      .from(productCollection)
      .innerJoin(collection, eq(productCollection.collectionId, collection.id))
      .where(eq(productCollection.productId, id)),
  ])

  return {
    name: row.name,
    code: row.code,
    slug: row.slug,
    description: row.description,
    priceVnd: row.priceVnd,
    priceDisplay: row.priceDisplay,
    kind: row.kind,
    isOld: row.isOld,
    status: row.status,
    publishedAt: row.publishedAt,
    tags: row.tags,
    purchaseOptions: row.purchaseOptions,
    imageUrls: images.map((item) => item.url),
    attributeLabels: attributes.map((item) => item.label.vi || item.label.en),
    collectionNames: collections.map((item) => item.name.vi || item.name.en),
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoKeywords: row.seoKeywords,
  }
}

export async function createProductAction(
  input: ProductInput
): Promise<ActionResult<{ slug: string }>> {
  const session = await requireUsableAdminSession()
  const parsed = validateProduct(input)
  if (!parsed.ok) return parsed

  const [existing] = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.slug, parsed.slug))
    .limit(1)
  if (existing) return actionFail("Đường dẫn sản phẩm đã tồn tại.")

  const publish = resolvePublishFields({
    intent: input.intent,
    publishedAt: input.publishedAt,
  })
  if (!publish.ok) return publish

  const kind = input.kind ?? "gown"
  const sortNumber = await nextSortNumber()
  const name = sanitizePlainText(input.name)
  const values = {
    slug: parsed.slug,
    name,
    code: sanitizePlainText(input.code ?? ""),
    description: toLocalized(input.descriptionVi ?? "", input.descriptionEn ?? ""),
    priceVnd: input.priceVnd ?? null,
    priceDisplay: parsed.priceDisplay,
    kind,
    isOld: input.isOld === true,
    status: publish.data.status,
    publishedAt: publish.data.publishedAt,
    tags: (input.tags ?? [])
      .map((tag) => sanitizePlainText(tag))
      .filter(Boolean),
    purchaseOptions: parsePurchaseOptions(input.purchaseOptions),
    seoTitle: toLocalized(input.seoTitleVi ?? "", input.seoTitleEn),
    seoDescription: toLocalized(input.seoDescriptionVi ?? "", input.seoDescriptionEn),
    seoKeywords: toLocalized(input.seoKeywordsVi ?? "", input.seoKeywordsEn),
  }
  const [row] = await db
    .insert(product)
    .values({
      ...values,
      sortNumber,
      featured: true,
      sortOrder: sortNumber,
    })
    .$returningId()

  if (!row) return actionFail("Không tạo được sản phẩm.")

  const attributeIds = await attributeIdsForKind(input.attributeIds ?? [], kind)
  const collectionIds = input.collectionIds ?? []
  const catalogSlugs = await catalogSlugsForIds(collectionIds, attributeIds)
  await replaceJoins(row.id, attributeIds, collectionIds, parsed.imageUrls)
  await recordAudit(session, async () => ({
    action: "create",
    area: "product",
    entityLabel: name,
    summary: `Tạo sản phẩm ${name}`,
    changes: productAuditChanges(null, {
      ...values,
      imageUrls: parsed.imageUrls,
      attributeLabels: await attributeLabels(attributeIds),
      collectionNames: await collectionNames(collectionIds),
    }),
  }))
  await revalidateAdmin(
    productStorefrontPaths({
      slugs: [parsed.slug],
      kinds: [kind],
      catalogSlugs,
    })
  )
  return actionOk({ slug: parsed.slug })
}

export async function updateProductAction(
  id: string,
  input: ProductInput
): Promise<ActionResult<{ slug: string }>> {
  const session = await requireUsableAdminSession()
  const parsed = validateProduct(input)
  if (!parsed.ok) return parsed

  const [existing] = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.slug, parsed.slug))
    .limit(1)
  if (existing && existing.id !== id) {
    return actionFail("Đường dẫn sản phẩm đã tồn tại.")
  }

  const current = await loadProductAuditState(id)
  const publish = resolvePublishFields({
    intent: input.intent,
    publishedAt: input.publishedAt,
    existingPublishedAt: current?.publishedAt ?? null,
  })
  if (!publish.ok) return publish

  const previous = await loadProductStorefrontContext([id])
  const kind = input.kind ?? "gown"
  const attributeIds = await attributeIdsForKind(input.attributeIds ?? [], kind)
  const collectionIds = input.collectionIds ?? []
  const catalogSlugs = await catalogSlugsForIds(collectionIds, attributeIds)
  const name = sanitizePlainText(input.name)
  const values = {
    slug: parsed.slug,
    name,
    code: sanitizePlainText(input.code ?? ""),
    description: toLocalized(input.descriptionVi ?? "", input.descriptionEn ?? ""),
    priceVnd: input.priceVnd ?? null,
    priceDisplay: parsed.priceDisplay,
    kind,
    isOld: input.isOld === true,
    status: publish.data.status,
    publishedAt: publish.data.publishedAt,
    tags: (input.tags ?? [])
      .map((tag) => sanitizePlainText(tag))
      .filter(Boolean),
    purchaseOptions: parsePurchaseOptions(input.purchaseOptions),
    seoTitle: toLocalized(input.seoTitleVi ?? "", input.seoTitleEn),
    seoDescription: toLocalized(input.seoDescriptionVi ?? "", input.seoDescriptionEn),
    seoKeywords: toLocalized(input.seoKeywordsVi ?? "", input.seoKeywordsEn),
  }

  await db.update(product).set(values).where(eq(product.id, id))

  await replaceJoins(id, attributeIds, collectionIds, parsed.imageUrls)
  if (current) {
    await recordAudit(session, async () => ({
      action: "update",
      area: "product",
      entityLabel: name,
      summary: `Cập nhật sản phẩm ${name}`,
      changes: productAuditChanges(current, {
        ...values,
        imageUrls: parsed.imageUrls,
        attributeLabels: await attributeLabels(attributeIds),
        collectionNames: await collectionNames(collectionIds),
      }),
    }))
  }
  await revalidateAdmin(
    productStorefrontPaths({
      slugs: [...previous.slugs, parsed.slug],
      kinds: [...previous.kinds, kind],
      catalogSlugs: [...previous.catalogSlugs, ...catalogSlugs],
    })
  )
  return actionOk({ slug: parsed.slug })
}

export async function deleteProductsAction(
  ids: string[]
): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  if (!ids.length) return actionFail("Chưa chọn sản phẩm.")

  const previous = await loadProductStorefrontContext(ids)
  const [images, rows] = await Promise.all([
    db
      .select({ url: productImage.url })
      .from(productImage)
      .where(inArray(productImage.productId, ids)),
    db
      .select({ name: product.name })
      .from(product)
      .where(inArray(product.id, ids)),
  ])

  await db.delete(product).where(inArray(product.id, ids))
  for (const row of rows) {
    await recordAudit(session, {
      action: "delete",
      area: "product",
      entityLabel: row.name,
      summary: `Xóa sản phẩm ${row.name}`,
      changes: deletedChange(row.name),
    })
  }
  await cleanupRemovedCmsImages(
    images.map((row) => row.url),
    []
  )
  await revalidateAdmin(productStorefrontPaths(previous))
  return actionOk()
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  return deleteProductsAction([id])
}
