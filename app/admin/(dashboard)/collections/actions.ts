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
import { selectCollectionsForUpdate } from "@/lib/home-carousel-admin"
import {
  HOME_CAROUSEL_GENERIC_ERROR,
  planHomeCarouselMembership,
} from "@/lib/home-carousel"

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
  showOnHome?: boolean
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
  showOnHome: boolean
  homeOrder: number | null
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
    {
      label: "Carousel trang chủ",
      before: before?.showOnHome ? "Hiện" : "Ẩn",
      after: after.showOnHome ? "Hiện" : "Ẩn",
    },
    {
      label: "Thứ tự carousel",
      before: before?.homeOrder ?? "",
      after: after.homeOrder ?? "",
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
    showOnHome: Boolean(row.showOnHome),
    homeOrder: row.homeOrder == null ? null : Number(row.homeOrder),
  }
}

export async function createCollectionAction(
  input: CollectionInput
): Promise<ActionResult<{ slug: string; carousel: "added" | "removed" | null }>> {
  const session = await requireUsableAdminSession()
  if (!input.nameVi.trim()) return actionFail("Vui lòng nhập tên bộ sưu tập.")
  if (input.showOnHome !== undefined && typeof input.showOnHome !== "boolean") {
    return actionFail(HOME_CAROUSEL_GENERIC_ERROR)
  }
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
  const created = await db.transaction(async (tx) => {
    const rows = await selectCollectionsForUpdate(tx)
    const plan = planHomeCarouselMembership(rows, null, input.showOnHome === true)
    if (!plan.ok) return plan
    const [row] = await tx
      .insert(collection)
      .values({
        ...values,
        sortOrder: 99,
        showOnHome: plan.showOnHome,
        homeOrder: plan.homeOrder,
      })
      .$returningId()
    if (!row) return actionFail("Không tạo được bộ sưu tập.")
    return actionOk({ id: row.id, plan })
  })
  if (!created.ok) return created

  await replaceCollectionImages(created.data.id, coverUrl, galleryUrls)
  await recordAudit(session, {
    action: "create",
    area: "collection",
    entityLabel: values.name.vi,
    summary: `Tạo bộ sưu tập ${values.name.vi}`,
    changes: collectionAuditChanges(null, {
      ...values,
      galleryUrls,
      showOnHome: created.data.plan.showOnHome,
      homeOrder: created.data.plan.homeOrder,
    }),
  })
  await revalidateAdmin(collectionStorefrontPaths([slugResult.slug]))
  return actionOk({
    slug: slugResult.slug,
    carousel:
      created.data.plan.changed && created.data.plan.showOnHome ? "added" : null,
  })
}

export async function updateCollectionAction(
  id: string,
  input: CollectionInput
): Promise<ActionResult<{ slug: string; carousel: "added" | "removed" | null }>> {
  const session = await requireUsableAdminSession()
  if (!input.nameVi.trim()) return actionFail("Vui lòng nhập tên bộ sưu tập.")
  if (input.showOnHome !== undefined && typeof input.showOnHome !== "boolean") {
    return actionFail(HOME_CAROUSEL_GENERIC_ERROR)
  }
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

  const saved = await db.transaction(async (tx) => {
    const rows = await selectCollectionsForUpdate(tx)
    const locked = rows.find((row) => row.id === id)
    if (!locked) return actionFail("Không tìm thấy bộ sưu tập.")
    const enabled =
      typeof input.showOnHome === "boolean" ? input.showOnHome : locked.showOnHome
    const plan = planHomeCarouselMembership(rows, locked, enabled)
    if (!plan.ok) return plan
    await tx
      .update(collection)
      .set({
        ...values,
        showOnHome: plan.showOnHome,
        homeOrder: plan.homeOrder,
      })
      .where(eq(collection.id, id))
    return actionOk({ plan, locked })
  })
  if (!saved.ok) return saved

  await replaceCollectionImages(id, coverUrl, galleryUrls)
  if (current) {
    await recordAudit(session, {
      action: "update",
      area: "collection",
      entityLabel: values.name.vi,
      summary: `Cập nhật bộ sưu tập ${values.name.vi}`,
      changes: collectionAuditChanges(
        {
          ...current,
          showOnHome: saved.data.locked.showOnHome,
          homeOrder: saved.data.locked.homeOrder,
        },
        {
          ...values,
          galleryUrls,
          showOnHome: saved.data.plan.showOnHome,
          homeOrder: saved.data.plan.homeOrder,
        }
      ),
    })
  }
  await revalidateAdmin(
    collectionStorefrontPaths([current?.slug, slugResult.slug])
  )
  const carousel = saved.data.plan.changed
    ? saved.data.plan.showOnHome
      ? "added"
      : "removed"
    : null
  return actionOk({ slug: slugResult.slug, carousel })
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
