"use server"

import { count, eq } from "drizzle-orm"
import {
  actionFail,
  actionOk,
  assertNotVirtualSlug,
  isCatalogSlugTaken,
  revalidateAdmin,
  requireSlug,
  seoLocalized,
  toLocalized,
  type ActionResult,
} from "@/lib/admin-actions"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { db } from "@/lib/db"
import {
  collection,
  collectionImage,
  productCollection,
} from "@/lib/db/schema"
import {
  resolvePublishFields,
  type PublishIntent,
} from "@/lib/content-schedule"
import { sanitizeMediaUrl, sanitizeMediaUrls } from "@/lib/sanitize-url"

export type CollectionInput = {
  nameVi: string
  nameEn?: string
  subtitleVi?: string
  subtitleEn?: string
  imageAltVi?: string
  imageAltEn?: string
  slug: string
  year?: number | null
  intent: PublishIntent
  publishedAt?: string | null
  coverUrl: string
  galleryUrls?: string[]
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
}

export async function createCollectionAction(
  input: CollectionInput
): Promise<ActionResult<{ slug: string }>> {
  await requireUsableAdminSession()
  if (!input.nameVi.trim()) return actionFail("Vui lòng nhập tên bộ sưu tập.")
  const coverUrl = sanitizeMediaUrl(input.coverUrl)
  if (!coverUrl) return actionFail("Vui lòng tải lên ảnh bìa.")
  const galleryUrls = sanitizeMediaUrls(input.galleryUrls ?? [])
  const slugResult = requireSlug(input.slug)
  if (!slugResult.ok) return slugResult
  const virtual = assertNotVirtualSlug(slugResult.slug)
  if (virtual) return virtual
  if (await isCatalogSlugTaken(slugResult.slug)) {
    return actionFail("Đường dẫn đã dùng cho bộ sưu tập hoặc danh mục khác.")
  }

  const publish = resolvePublishFields({
    intent: input.intent,
    publishedAt: input.publishedAt,
  })
  if (!publish.ok) return publish

  const [row] = await db
    .insert(collection)
    .values({
      slug: slugResult.slug,
      year: input.year ?? null,
      name: toLocalized(input.nameVi, input.nameEn),
      subtitle: toLocalized(input.subtitleVi ?? "", input.subtitleEn),
      imageAlt: toLocalized(input.imageAltVi ?? "", input.imageAltEn),
      coverUrl,
      status: publish.data.status,
      publishedAt: publish.data.publishedAt,
      sortOrder: 99,
      seoTitle: seoLocalized(input.seoTitle ?? ""),
      seoDescription: seoLocalized(input.seoDescription ?? ""),
      seoKeywords: seoLocalized(input.seoKeywords ?? ""),
    })
    .$returningId()

  if (!row) return actionFail("Không tạo được bộ sưu tập.")
  await replaceCollectionImages(row.id, coverUrl, galleryUrls)
  await revalidateAdmin()
  return actionOk({ slug: slugResult.slug })
}

export async function updateCollectionAction(
  id: string,
  input: CollectionInput
): Promise<ActionResult<{ slug: string }>> {
  await requireUsableAdminSession()
  if (!input.nameVi.trim()) return actionFail("Vui lòng nhập tên bộ sưu tập.")
  const coverUrl = sanitizeMediaUrl(input.coverUrl)
  if (!coverUrl) return actionFail("Vui lòng tải lên ảnh bìa.")
  const galleryUrls = sanitizeMediaUrls(input.galleryUrls ?? [])
  const slugResult = requireSlug(input.slug)
  if (!slugResult.ok) return slugResult
  const virtual = assertNotVirtualSlug(slugResult.slug)
  if (virtual) return virtual
  if (await isCatalogSlugTaken(slugResult.slug, { collectionId: id })) {
    return actionFail("Đường dẫn đã dùng cho bộ sưu tập hoặc danh mục khác.")
  }

  const [current] = await db
    .select({ publishedAt: collection.publishedAt })
    .from(collection)
    .where(eq(collection.id, id))
    .limit(1)
  const publish = resolvePublishFields({
    intent: input.intent,
    publishedAt: input.publishedAt,
    existingPublishedAt: current?.publishedAt ?? null,
  })
  if (!publish.ok) return publish

  await db
    .update(collection)
    .set({
      slug: slugResult.slug,
      year: input.year ?? null,
      name: toLocalized(input.nameVi, input.nameEn),
      subtitle: toLocalized(input.subtitleVi ?? "", input.subtitleEn),
      imageAlt: toLocalized(input.imageAltVi ?? "", input.imageAltEn),
      coverUrl,
      status: publish.data.status,
      publishedAt: publish.data.publishedAt,
      seoTitle: seoLocalized(input.seoTitle ?? ""),
      seoDescription: seoLocalized(input.seoDescription ?? ""),
      seoKeywords: seoLocalized(input.seoKeywords ?? ""),
    })
    .where(eq(collection.id, id))

  await replaceCollectionImages(id, coverUrl, galleryUrls)
  await revalidateAdmin()
  return actionOk({ slug: slugResult.slug })
}

export async function deleteCollectionAction(id: string): Promise<ActionResult> {
  await requireUsableAdminSession()
  const [usage] = await db
    .select({ value: count() })
    .from(productCollection)
    .where(eq(productCollection.collectionId, id))

  if (Number(usage?.value ?? 0) > 0) {
    return actionFail("Không xóa được bộ sưu tập đang gắn sản phẩm.")
  }

  await db.delete(collection).where(eq(collection.id, id))
  await revalidateAdmin()
  return actionOk()
}

async function replaceCollectionImages(
  collectionId: string,
  coverUrl: string,
  galleryUrls: string[]
) {
  await db.delete(collectionImage).where(eq(collectionImage.collectionId, collectionId))
  const urls = [coverUrl, ...galleryUrls.filter((url) => url !== coverUrl)]
  await db.insert(collectionImage).values(
    urls.map((url, index) => ({
      collectionId,
      url,
      sortOrder: index,
    }))
  )
}
