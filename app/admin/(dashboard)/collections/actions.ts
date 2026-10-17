"use server"

import { asc, count, eq } from "drizzle-orm"
import {
  actionFail,
  actionOk,
  assertNotVirtualSlug,
  isCatalogSlugTaken,
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
import type { LocalizedText } from "@/lib/site-settings"
import { cleanupRemovedCmsImages } from "@/lib/cms-image-storage"

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
  seoTitleVi?: string
  seoTitleEn?: string
  seoDescriptionVi?: string
  seoDescriptionEn?: string
  seoKeywordsVi?: string
  seoKeywordsEn?: string
}

function collectionStorefrontPaths(slugs: Array<string | undefined>) {
  return ["/", ...slugs.filter((slug): slug is string => Boolean(slug)).map((slug) => `/catalog/${slug}`)]
}

type CollectionAuditSnapshot = {
  name: LocalizedText
  subtitle: LocalizedText
  imageAlt: LocalizedText
  slug: string
  year: number | null
  coverUrl: string
  galleryUrls: string[]
  status: string
  publishedAt: Date | null
  seoTitle: LocalizedText
  seoDescription: LocalizedText
  seoKeywords: LocalizedText
}

function collectionAuditChanges(
  before: CollectionAuditSnapshot | null,
  after: CollectionAuditSnapshot
) {
  return diffFields([
    ...localizedChanges("Tên", before?.name, after.name),
    ...localizedChanges("Phụ đề", before?.subtitle, after.subtitle),
    ...localizedChanges("Mô tả ảnh", before?.imageAlt, after.imageAlt),
    { label: "Đường dẫn", before: before?.slug ?? "", after: after.slug },
    { label: "Năm", before: before?.year ?? "", after: after.year ?? "" },
    { label: "Ảnh bìa", before: before?.coverUrl ?? "", after: after.coverUrl, images: true },
    {
      label: "Ảnh gallery",
      before: before ? joinAuditList(before.galleryUrls) : "",
      after: joinAuditList(after.galleryUrls),
      images: true,
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
    ...localizedChanges("Tiêu đề SEO", before?.seoTitle, after.seoTitle),
    ...localizedChanges("Mô tả SEO", before?.seoDescription, after.seoDescription),
    ...localizedChanges("Từ khóa SEO", before?.seoKeywords, after.seoKeywords),
  ])
}

async function loadCollectionAudit(id: string): Promise<CollectionAuditSnapshot | null> {
  const [row] = await db.select().from(collection).where(eq(collection.id, id)).limit(1)
  if (!row) return null
  const images = await db
    .select({ url: collectionImage.url })
    .from(collectionImage)
    .where(eq(collectionImage.collectionId, id))
    .orderBy(asc(collectionImage.sortOrder))
  return {
    name: row.name,
    subtitle: row.subtitle,
    imageAlt: row.imageAlt,
    slug: row.slug,
    year: row.year,
    coverUrl: row.coverUrl,
    galleryUrls: images.map((item) => item.url).filter((url) => url !== row.coverUrl),
    status: row.status,
    publishedAt: row.publishedAt,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoKeywords: row.seoKeywords,
  }
}

export async function createCollectionAction(
  input: CollectionInput
): Promise<ActionResult<{ slug: string }>> {
  const session = await requireUsableAdminSession()
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

  const values = {
    slug: slugResult.slug,
    year: input.year ?? null,
    name: toLocalized(input.nameVi, input.nameEn),
    subtitle: toLocalized(input.subtitleVi ?? "", input.subtitleEn),
    imageAlt: toLocalized(input.imageAltVi ?? "", input.imageAltEn),
    coverUrl,
    status: publish.data.status,
    publishedAt: publish.data.publishedAt,
    seoTitle: toLocalized(input.seoTitleVi ?? "", input.seoTitleEn),
    seoDescription: toLocalized(input.seoDescriptionVi ?? "", input.seoDescriptionEn),
    seoKeywords: toLocalized(input.seoKeywordsVi ?? "", input.seoKeywordsEn),
  }
  const [row] = await db
    .insert(collection)
    .values({
      ...values,
      sortOrder: 99,
    })
    .$returningId()

  if (!row) return actionFail("Không tạo được bộ sưu tập.")
  await replaceCollectionImages(row.id, coverUrl, galleryUrls)
  await recordAudit(session, {
    action: "create",
    area: "collection",
    entityLabel: values.name.vi,
    summary: `Tạo bộ sưu tập ${values.name.vi}`,
    changes: collectionAuditChanges(null, { ...values, galleryUrls }),
  })
  await revalidateAdmin(collectionStorefrontPaths([slugResult.slug]))
  return actionOk({ slug: slugResult.slug })
}

export async function updateCollectionAction(
  id: string,
  input: CollectionInput
): Promise<ActionResult<{ slug: string }>> {
  const session = await requireUsableAdminSession()
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

  const current = await loadCollectionAudit(id)
  const publish = resolvePublishFields({
    intent: input.intent,
    publishedAt: input.publishedAt,
    existingPublishedAt: current?.publishedAt ?? null,
  })
  if (!publish.ok) return publish

  const values = {
    slug: slugResult.slug,
    year: input.year ?? null,
    name: toLocalized(input.nameVi, input.nameEn),
    subtitle: toLocalized(input.subtitleVi ?? "", input.subtitleEn),
    imageAlt: toLocalized(input.imageAltVi ?? "", input.imageAltEn),
    coverUrl,
    status: publish.data.status,
    publishedAt: publish.data.publishedAt,
    seoTitle: toLocalized(input.seoTitleVi ?? "", input.seoTitleEn),
    seoDescription: toLocalized(input.seoDescriptionVi ?? "", input.seoDescriptionEn),
    seoKeywords: toLocalized(input.seoKeywordsVi ?? "", input.seoKeywordsEn),
  }

  await db.update(collection).set(values).where(eq(collection.id, id))

  await replaceCollectionImages(id, coverUrl, galleryUrls)
  if (current) {
    await recordAudit(session, {
      action: "update",
      area: "collection",
      entityLabel: values.name.vi,
      summary: `Cập nhật bộ sưu tập ${values.name.vi}`,
      changes: collectionAuditChanges(current, { ...values, galleryUrls }),
    })
  }
  await revalidateAdmin(
    collectionStorefrontPaths([current?.slug, slugResult.slug])
  )
  return actionOk({ slug: slugResult.slug })
}

export async function deleteCollectionAction(id: string): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  const [usage] = await db
    .select({ value: count() })
    .from(productCollection)
    .where(eq(productCollection.collectionId, id))

  if (Number(usage?.value ?? 0) > 0) {
    return actionFail("Không xóa được bộ sưu tập đang gắn sản phẩm.")
  }

  const [row] = await db
    .select({ coverUrl: collection.coverUrl, slug: collection.slug, name: collection.name })
    .from(collection)
    .where(eq(collection.id, id))
    .limit(1)
  const images = await db
    .select({ url: collectionImage.url })
    .from(collectionImage)
    .where(eq(collectionImage.collectionId, id))

  await db.delete(collection).where(eq(collection.id, id))
  const name = row?.name.vi || row?.name.en || row?.slug || ""
  await recordAudit(session, {
    action: "delete",
    area: "collection",
    entityLabel: name,
    summary: `Xóa bộ sưu tập ${name}`,
    changes: deletedChange(name),
  })
  await cleanupRemovedCmsImages(
    [...images.map((item) => item.url), row?.coverUrl ?? ""],
    []
  )
  await revalidateAdmin(collectionStorefrontPaths([row?.slug]))
  return actionOk()
}

async function replaceCollectionImages(
  collectionId: string,
  coverUrl: string,
  galleryUrls: string[]
) {
  const previous = await db
    .select({ url: collectionImage.url })
    .from(collectionImage)
    .where(eq(collectionImage.collectionId, collectionId))

  await db.delete(collectionImage).where(eq(collectionImage.collectionId, collectionId))
  const urls = [coverUrl, ...galleryUrls.filter((url) => url !== coverUrl)]
  await db.insert(collectionImage).values(
    urls.map((url, index) => ({
      collectionId,
      url,
      sortOrder: index,
    }))
  )
  await cleanupRemovedCmsImages(
    previous.map((row) => row.url),
    urls
  )
}
