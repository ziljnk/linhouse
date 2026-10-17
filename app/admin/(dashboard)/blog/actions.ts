"use server"

import { eq } from "drizzle-orm"
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
  return row?.label.vi || row?.label.en || ""
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
            category: await blogCategoryName(previous.categoryId),
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
