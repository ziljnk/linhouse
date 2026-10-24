"use server"

import { randomUUID } from "node:crypto"
import { and, count, eq, ne } from "drizzle-orm"
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
  localizedChanges,
} from "@/lib/admin-audit-shared"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { sanitizeRichTextHtml } from "@/lib/sanitize-content"
import { sanitizeMediaUrl } from "@/lib/sanitize-url"
import type { LocalizedText } from "@/lib/site-settings"
import { cleanupRemovedCmsImages } from "@/lib/cms-image-storage"
import { db } from "@/lib/db"
import { blogCategory, blogPost } from "@/lib/db/schema"
import {
  resolvePublishFields,
  type PublishIntent,
} from "@/lib/content-schedule"

export type BlogIntent = PublishIntent

export type BlogInput = {
  titleVi: string
  titleEn?: string
  excerptVi?: string
  excerptEn?: string
  contentVi?: string
  contentEn?: string
  imageAltVi?: string
  imageAltEn?: string
  slug: string
  categoryId: string
  coverUrl: string
  intent: BlogIntent
  publishedAt?: string | null
  seoTitleVi?: string
  seoTitleEn?: string
  seoDescriptionVi?: string
  seoDescriptionEn?: string
  seoKeywordsVi?: string
  seoKeywordsEn?: string
}

function blogStorefrontPaths(slugs: Array<string | undefined>) {
  return [
    "/",
    "/blog",
    ...slugs
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => `/blog/${slug}`),
  ]
}

type BlogAuditSnapshot = {
  title: LocalizedText
  excerpt: LocalizedText
  content: LocalizedText
  imageAlt: LocalizedText
  slug: string
  category: string
  coverUrl: string
  status: string
  publishedAt: Date | null
  seoTitle: LocalizedText
  seoDescription: LocalizedText
  seoKeywords: LocalizedText
}

function blogAuditChanges(before: BlogAuditSnapshot | null, after: BlogAuditSnapshot) {
  return diffFields([
    ...localizedChanges("Tiêu đề", before?.title, after.title),
    ...localizedChanges("Tóm tắt", before?.excerpt, after.excerpt),
    ...localizedChanges("Nội dung", before?.content, after.content),
    ...localizedChanges("Mô tả ảnh", before?.imageAlt, after.imageAlt),
    { label: "Đường dẫn", before: before?.slug ?? "", after: after.slug },
    { label: "Chuyên mục", before: before?.category ?? "", after: after.category },
    { label: "Ảnh bìa", before: before?.coverUrl ?? "", after: after.coverUrl, images: true },
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

async function blogCategoryName(id: string) {
  const [row] = await db
    .select({ label: blogCategory.label })
    .from(blogCategory)
    .where(eq(blogCategory.id, id))
    .limit(1)
  if (!row) return null
  return row.label.vi || row.label.en || ""
}

export type BlogCategoryInput = {
  labelVi: string
  labelEn?: string
  slug: string
}

async function blogCategorySlugTaken(slug: string, excludeId?: string) {
  const [row] = await db
    .select({ id: blogCategory.id })
    .from(blogCategory)
    .where(
      excludeId
        ? and(eq(blogCategory.slug, slug), ne(blogCategory.id, excludeId))
        : eq(blogCategory.slug, slug)
    )
    .limit(1)
  return Boolean(row)
}

function categoryAuditChanges(
  before: { label: LocalizedText; slug: string } | null,
  after: { label: LocalizedText; slug: string }
) {
  return diffFields([
    ...localizedChanges("Tên danh mục", before?.label, after.label),
    { label: "Đường dẫn", before: before?.slug ?? "", after: after.slug },
  ])
}

function parseBlogCategoryInput(input: BlogCategoryInput) {
  if (!input.labelVi.trim()) return actionFail("Vui lòng nhập tên danh mục.")
  const slugResult = requireSlug(input.slug, "Đường dẫn danh mục")
  if (!slugResult.ok) return slugResult
  return actionOk({
    slug: slugResult.slug,
    label: toLocalized(input.labelVi, input.labelEn),
  })
}

export async function createBlogCategoryAction(
  input: BlogCategoryInput
): Promise<
  ActionResult<{
    id: string
    slug: string
    label: string
    labelVi: string
    labelEn: string
  }>
> {
  const session = await requireUsableAdminSession()
  const parsed = parseBlogCategoryInput(input)
  if (!parsed.ok) return parsed
  if (await blogCategorySlugTaken(parsed.data.slug)) {
    return actionFail("Đường dẫn danh mục đã tồn tại.")
  }

  const id = randomUUID()
  await db.insert(blogCategory).values({ id, ...parsed.data })
  const name = parsed.data.label.vi || parsed.data.label.en
  await recordAudit(session, {
    action: "create",
    area: "blog",
    entityLabel: name,
    summary: `Tạo danh mục blog ${name}`,
    changes: categoryAuditChanges(null, parsed.data),
  })
  await revalidateAdmin(["/", "/blog"])
  return actionOk({
    id,
    slug: parsed.data.slug,
    label: name || parsed.data.slug,
    labelVi: parsed.data.label.vi,
    labelEn: parsed.data.label.en,
  })
}

export async function updateBlogCategoryAction(
  id: string,
  input: BlogCategoryInput
): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  const parsed = parseBlogCategoryInput(input)
  if (!parsed.ok) return parsed
  if (await blogCategorySlugTaken(parsed.data.slug, id)) {
    return actionFail("Đường dẫn danh mục đã tồn tại.")
  }

  const [current] = await db
    .select({ slug: blogCategory.slug, label: blogCategory.label })
    .from(blogCategory)
    .where(eq(blogCategory.id, id))
    .limit(1)
  if (!current) return actionFail("Không tìm thấy danh mục.")

  await db.update(blogCategory).set(parsed.data).where(eq(blogCategory.id, id))
  const name = parsed.data.label.vi || parsed.data.label.en
  await recordAudit(session, {
    action: "update",
    area: "blog",
    entityLabel: name,
    summary: `Cập nhật danh mục blog ${name}`,
    changes: categoryAuditChanges(current, parsed.data),
  })
  await revalidateAdmin(["/", "/blog"])
  return actionOk()
}

export async function deleteBlogCategoryAction(id: string): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  const [usage] = await db
    .select({ value: count() })
    .from(blogPost)
    .where(eq(blogPost.categoryId, id))
  if (Number(usage?.value ?? 0) > 0) {
    return actionFail("Không xóa được danh mục đang có bài viết.")
  }

  const [row] = await db
    .select({ slug: blogCategory.slug, label: blogCategory.label })
    .from(blogCategory)
    .where(eq(blogCategory.id, id))
    .limit(1)
  if (!row) return actionFail("Không tìm thấy danh mục.")

  await db.delete(blogCategory).where(eq(blogCategory.id, id))
  const name = row.label.vi || row.label.en || row.slug
  await recordAudit(session, {
    action: "delete",
    area: "blog",
    entityLabel: name,
    summary: `Xóa danh mục blog ${name}`,
    changes: deletedChange(name),
  })
  await revalidateAdmin(["/", "/blog"])
  return actionOk()
}

export async function saveBlogPostAction(
  input: BlogInput & { id?: string }
): Promise<ActionResult<{ slug: string }>> {
  const session = await requireUsableAdminSession()
  if (!input.titleVi.trim()) return actionFail("Vui lòng nhập tiêu đề.")
  if (!input.categoryId) return actionFail("Vui lòng chọn chuyên mục.")
  const coverUrl = sanitizeMediaUrl(input.coverUrl)
  if (input.intent !== "draft" && !coverUrl) {
    return actionFail("Vui lòng tải ảnh bìa.")
  }
  const slugResult = requireSlug(input.slug)
  if (!slugResult.ok) return slugResult

  const [existing] = await db
    .select({
      id: blogPost.id,
      publishedAt: blogPost.publishedAt,
    })
    .from(blogPost)
    .where(eq(blogPost.slug, slugResult.slug))
    .limit(1)
  if (existing && existing.id !== input.id) {
    return actionFail("Đường dẫn bài viết đã tồn tại.")
  }

  const current =
    input.id && existing?.id === input.id
      ? existing
      : input.id
        ? (
            await db
              .select({
                id: blogPost.id,
                publishedAt: blogPost.publishedAt,
              })
              .from(blogPost)
              .where(eq(blogPost.id, input.id))
              .limit(1)
          )[0]
        : undefined

  const publish = resolvePublishFields({
    intent: input.intent,
    publishedAt: input.publishedAt,
    existingPublishedAt: current?.publishedAt ?? null,
  })
  if (!publish.ok) return publish

  const category = await blogCategoryName(input.categoryId)
  if (category === null) {
    return actionFail("Danh mục không còn tồn tại. Hãy tạo hoặc chọn danh mục khác.")
  }
  const values = {
    slug: slugResult.slug,
    categoryId: input.categoryId,
    title: toLocalized(input.titleVi, input.titleEn),
    excerpt: toLocalized(input.excerptVi ?? "", input.excerptEn),
    content: {
      vi: sanitizeRichTextHtml(input.contentVi ?? ""),
      en: sanitizeRichTextHtml(input.contentEn ?? ""),
    },
    imageAlt: toLocalized(input.imageAltVi ?? "", input.imageAltEn),
    coverUrl: coverUrl ?? "",
    status: publish.data.status,
    publishedAt: publish.data.publishedAt,
    seoTitle: toLocalized(input.seoTitleVi ?? "", input.seoTitleEn),
    seoDescription: toLocalized(input.seoDescriptionVi ?? "", input.seoDescriptionEn),
    seoKeywords: toLocalized(input.seoKeywordsVi ?? "", input.seoKeywordsEn),
  }
  const nextAudit: BlogAuditSnapshot = {
    title: values.title,
    excerpt: values.excerpt,
    content: values.content,
    imageAlt: values.imageAlt,
    slug: values.slug,
    category,
    coverUrl: values.coverUrl,
    status: values.status,
    publishedAt: values.publishedAt,
    seoTitle: values.seoTitle,
    seoDescription: values.seoDescription,
    seoKeywords: values.seoKeywords,
  }

  if (input.id) {
    const [previous] = await db
      .select()
      .from(blogPost)
      .where(eq(blogPost.id, input.id))
      .limit(1)
    await db.update(blogPost).set(values).where(eq(blogPost.id, input.id))
    await cleanupRemovedCmsImages([previous?.coverUrl ?? ""], [coverUrl ?? ""])
    if (previous) {
      await recordAudit(session, async () => ({
        action: "update",
        area: "blog",
        entityLabel: values.title.vi,
        summary: `Cập nhật bài viết ${values.title.vi}`,
        changes: blogAuditChanges(
          {
            title: previous.title,
            excerpt: previous.excerpt,
            content: previous.content,
            imageAlt: previous.imageAlt,
            slug: previous.slug,
            category: (await blogCategoryName(previous.categoryId)) ?? "",
            coverUrl: previous.coverUrl,
            status: previous.status,
            publishedAt: previous.publishedAt,
            seoTitle: previous.seoTitle,
            seoDescription: previous.seoDescription,
            seoKeywords: previous.seoKeywords,
          },
          nextAudit
        ),
      }))
    }
    await revalidateAdmin(blogStorefrontPaths([previous?.slug, slugResult.slug]))
    return actionOk({ slug: slugResult.slug })
  }

  await db.insert(blogPost).values(values)
  await recordAudit(session, {
    action: "create",
    area: "blog",
    entityLabel: values.title.vi,
    summary: `Tạo bài viết ${values.title.vi}`,
    changes: blogAuditChanges(null, nextAudit),
  })
  await revalidateAdmin(blogStorefrontPaths([slugResult.slug]))
  return actionOk({ slug: slugResult.slug })
}

export async function deleteBlogPostAction(id: string): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  const [row] = await db
    .select({ coverUrl: blogPost.coverUrl, slug: blogPost.slug, title: blogPost.title })
    .from(blogPost)
    .where(eq(blogPost.id, id))
    .limit(1)
  await db.delete(blogPost).where(eq(blogPost.id, id))
  const title = row?.title.vi || row?.title.en || row?.slug || ""
  await recordAudit(session, {
    action: "delete",
    area: "blog",
    entityLabel: title,
    summary: `Xóa bài viết ${title}`,
    changes: deletedChange(title),
  })
  await cleanupRemovedCmsImages([row?.coverUrl ?? ""], [])
  await revalidateAdmin(blogStorefrontPaths([row?.slug]))
  return actionOk()
}
