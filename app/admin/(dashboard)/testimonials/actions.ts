"use server"

import { eq } from "drizzle-orm"
import {
  actionFail,
  actionOk,
  revalidateAdmin,
  slugify,
  toLocalized,
  type ActionResult,
} from "@/lib/admin-actions"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { db } from "@/lib/db"
import { product, siteCopy, testimonial } from "@/lib/db/schema"
import type {
  TestimonialsSectionCopy,
  TestimonialStatus,
} from "@/lib/admin-testimonials"
import { sanitizePlainText } from "@/lib/sanitize-content"
import { sanitizeMediaUrl } from "@/lib/sanitize-url"
import { cleanupRemovedCmsImages } from "@/lib/cms-image-storage"

export type TestimonialInput = {
  name: string
  quoteVi: string
  quoteEn?: string
  imageUrl: string
  imageAltVi?: string
  imageAltEn?: string
  gown?: string
  year?: string
  status?: TestimonialStatus
}

async function findProductIdByGown(gown: string) {
  const trimmed = gown.trim()
  if (!trimmed) return null

  const rows = await db
    .select({ id: product.id, name: product.name, slug: product.slug })
    .from(product)
  const exact = rows.find(
    (item) => item.name.toLowerCase() === trimmed.toLowerCase()
  )
  if (exact) return exact.id
  const slug = slugify(trimmed)
  const bySlug = rows.find((item) => item.slug === slug)
  if (bySlug) return bySlug.id
  const first = trimmed.split(/\s+/)[0] ?? ""
  return (
    rows.find((item) => item.name.toLowerCase() === first.toLowerCase())?.id ??
    null
  )
}

export async function saveTestimonialAction(
  input: TestimonialInput & { id?: string }
): Promise<ActionResult<{ slug: string }>> {
  await requireUsableAdminSession()
  if (!input.name.trim()) return actionFail("Vui lòng nhập tên cô dâu.")
  if (!input.quoteVi.trim()) return actionFail("Vui lòng nhập lời nhận xét.")
  const imageUrl = sanitizeMediaUrl(input.imageUrl)
  if (!imageUrl) return actionFail("Vui lòng tải ảnh.")

  const slug = slugify(input.name)
  if (!slug) return actionFail("Tên không tạo được đường dẫn.")

  const [existing] = await db
    .select({ id: testimonial.id })
    .from(testimonial)
    .where(eq(testimonial.slug, slug))
    .limit(1)
  if (existing && existing.id !== input.id) {
    return actionFail("Đã có câu chuyện với tên này.")
  }

  const year = input.year?.trim() ? Number(input.year) : null
  const values = {
    slug,
    name: sanitizePlainText(input.name),
    quote: toLocalized(input.quoteVi, input.quoteEn),
    imageUrl,
    imageAlt: toLocalized(input.imageAltVi ?? "", input.imageAltEn),
    gown: sanitizePlainText(input.gown ?? ""),
    productId: await findProductIdByGown(input.gown ?? ""),
    year: Number.isFinite(year) ? year : null,
    status: input.status === "draft" ? "draft" as const : "published" as const,
  }

  if (input.id) {
    const [current] = await db
      .select({ imageUrl: testimonial.imageUrl })
      .from(testimonial)
      .where(eq(testimonial.id, input.id))
      .limit(1)
    await db.update(testimonial).set(values).where(eq(testimonial.id, input.id))
    await cleanupRemovedCmsImages([current?.imageUrl ?? ""], [imageUrl])
    await revalidateAdmin()
    return actionOk({ slug })
  }

  await db.insert(testimonial).values({
    ...values,
    sortOrder: 99,
  })
  await revalidateAdmin()
  return actionOk({ slug })
}

export async function deleteTestimonialAction(id: string): Promise<ActionResult> {
  await requireUsableAdminSession()
  const [row] = await db
    .select({ imageUrl: testimonial.imageUrl })
    .from(testimonial)
    .where(eq(testimonial.id, id))
    .limit(1)
  await db.delete(testimonial).where(eq(testimonial.id, id))
  await cleanupRemovedCmsImages([row?.imageUrl ?? ""], [])
  await revalidateAdmin()
  return actionOk()
}

export async function saveTestimonialsSectionAction(
  input: TestimonialsSectionCopy
): Promise<ActionResult> {
  await requireUsableAdminSession()
  if (!input.labelVi.trim() || !input.titleVi.trim()) {
    return actionFail("Vui lòng nhập nhãn và tiêu đề tiếng Việt.")
  }

  await db
    .insert(siteCopy)
    .values({
      key: "home.testimonials",
      value: {
        label: toLocalized(input.labelVi, input.labelEn),
        title: toLocalized(input.titleVi, input.titleEn),
      },
    })
    .onDuplicateKeyUpdate({
      set: {
        value: {
          label: toLocalized(input.labelVi, input.labelEn),
          title: toLocalized(input.titleVi, input.titleEn),
        },
      },
    })
  await revalidateAdmin()
  return actionOk()
}
