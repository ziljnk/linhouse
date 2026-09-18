"use server"

import { eq, inArray, max } from "drizzle-orm"
import {
  actionFail,
  actionOk,
  revalidateAdmin,
  requireSlug,
  seoLocalized,
  toLocalized,
  type ActionResult,
} from "@/lib/admin-actions"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { db } from "@/lib/db"
import {
  attributeGroup,
  catalogAttribute,
  product,
  productAttribute,
  productCollection,
  productImage,
} from "@/lib/db/schema"
import type { PriceDisplay, ProductKind } from "@/lib/admin-products"
import {
  resolvePublishFields,
  type PublishIntent,
} from "@/lib/content-schedule"
import { sanitizePlainText } from "@/lib/sanitize-content"
import { sanitizeMediaUrls } from "@/lib/sanitize-url"

export type ProductInput = {
  name: string
  code?: string
  slug: string
  descriptionVi?: string
  descriptionEn?: string
  attributeIds?: string[]
  collectionIds?: string[]
  tags?: string[]
  imageUrls?: string[]
  priceVnd?: number | null
  priceDisplay?: PriceDisplay
  kind?: ProductKind
  intent: PublishIntent
  publishedAt?: string | null
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
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

export async function createProductAction(
  input: ProductInput
): Promise<ActionResult<{ slug: string }>> {
  await requireUsableAdminSession()
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
  const [row] = await db
    .insert(product)
    .values({
      slug: parsed.slug,
      sortNumber,
      name: sanitizePlainText(input.name),
      code: sanitizePlainText(input.code ?? ""),
      fullTitle: "",
      description: toLocalized(input.descriptionVi ?? "", input.descriptionEn ?? ""),
      priceVnd: input.priceVnd ?? null,
      priceDisplay: parsed.priceDisplay,
      kind,
      featured: true,
      status: publish.data.status,
      publishedAt: publish.data.publishedAt,
      sortOrder: sortNumber,
      tags: (input.tags ?? [])
        .map((tag) => sanitizePlainText(tag))
        .filter(Boolean),
      seoTitle: seoLocalized(input.seoTitle ?? ""),
      seoDescription: seoLocalized(input.seoDescription ?? ""),
      seoKeywords: seoLocalized(input.seoKeywords ?? ""),
    })
    .$returningId()

  if (!row) return actionFail("Không tạo được sản phẩm.")

  await replaceJoins(
    row.id,
    await attributeIdsForKind(input.attributeIds ?? [], kind),
    input.collectionIds ?? [],
    parsed.imageUrls
  )
  await revalidateAdmin()
  return actionOk({ slug: parsed.slug })
}

export async function updateProductAction(
  id: string,
  input: ProductInput
): Promise<ActionResult<{ slug: string }>> {
  await requireUsableAdminSession()
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

  const [current] = await db
    .select({ publishedAt: product.publishedAt })
    .from(product)
    .where(eq(product.id, id))
    .limit(1)
  const publish = resolvePublishFields({
    intent: input.intent,
    publishedAt: input.publishedAt,
    existingPublishedAt: current?.publishedAt ?? null,
  })
  if (!publish.ok) return publish

  const kind = input.kind ?? "gown"
  await db
    .update(product)
    .set({
      slug: parsed.slug,
      name: sanitizePlainText(input.name),
      code: sanitizePlainText(input.code ?? ""),
      description: toLocalized(input.descriptionVi ?? "", input.descriptionEn ?? ""),
      priceVnd: input.priceVnd ?? null,
      priceDisplay: parsed.priceDisplay,
      kind,
      status: publish.data.status,
      publishedAt: publish.data.publishedAt,
      tags: (input.tags ?? [])
        .map((tag) => sanitizePlainText(tag))
        .filter(Boolean),
      seoTitle: seoLocalized(input.seoTitle ?? ""),
      seoDescription: seoLocalized(input.seoDescription ?? ""),
      seoKeywords: seoLocalized(input.seoKeywords ?? ""),
    })
    .where(eq(product.id, id))

  await replaceJoins(
    id,
    await attributeIdsForKind(input.attributeIds ?? [], kind),
    input.collectionIds ?? [],
    parsed.imageUrls
  )
  await revalidateAdmin()
  return actionOk({ slug: parsed.slug })
}

export async function deleteProductsAction(
  ids: string[]
): Promise<ActionResult> {
  await requireUsableAdminSession()
  if (!ids.length) return actionFail("Chưa chọn sản phẩm.")

  await db.delete(product).where(inArray(product.id, ids))
  await revalidateAdmin()
  return actionOk()
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  return deleteProductsAction([id])
}
