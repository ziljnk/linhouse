"use server"

import { eq } from "drizzle-orm"
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
import { sanitizeRichTextHtml } from "@/lib/sanitize-content"
import { sanitizeMediaUrl } from "@/lib/sanitize-url"
import { cleanupRemovedCmsImages } from "@/lib/cms-image-storage"
import { db } from "@/lib/db"
import { blogPost } from "@/lib/db/schema"
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
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
}

export async function saveBlogPostAction(
  input: BlogInput & { id?: string }
): Promise<ActionResult<{ slug: string }>> {
  await requireUsableAdminSession()
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
    seoTitle: seoLocalized(input.seoTitle ?? ""),
    seoDescription: seoLocalized(input.seoDescription ?? ""),
    seoKeywords: seoLocalized(input.seoKeywords ?? ""),
  }

  if (input.id) {
    const [previous] = await db
      .select({ coverUrl: blogPost.coverUrl })
      .from(blogPost)
      .where(eq(blogPost.id, input.id))
      .limit(1)
    await db.update(blogPost).set(values).where(eq(blogPost.id, input.id))
    await cleanupRemovedCmsImages([previous?.coverUrl ?? ""], [coverUrl ?? ""])
    await revalidateAdmin()
    return actionOk({ slug: slugResult.slug })
  }

  await db.insert(blogPost).values(values)
  await revalidateAdmin()
  return actionOk({ slug: slugResult.slug })
}

export async function deleteBlogPostAction(id: string): Promise<ActionResult> {
  await requireUsableAdminSession()
  const [row] = await db
    .select({ coverUrl: blogPost.coverUrl })
    .from(blogPost)
    .where(eq(blogPost.id, id))
    .limit(1)
  await db.delete(blogPost).where(eq(blogPost.id, id))
  await cleanupRemovedCmsImages([row?.coverUrl ?? ""], [])
  await revalidateAdmin()
  return actionOk()
}
