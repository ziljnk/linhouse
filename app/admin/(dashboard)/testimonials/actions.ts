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
import { recordAudit } from "@/lib/admin-audit"
import {
  deletedChange,
  diffFields,
  localizedChanges,
} from "@/lib/admin-audit-shared"
import { TESTIMONIAL_STATUS_LABELS } from "@/lib/admin-testimonials"
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
  const session = await requireUsableAdminSession()
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
      .select()
      .from(testimonial)
      .where(eq(testimonial.id, input.id))
      .limit(1)
    await db.update(testimonial).set(values).where(eq(testimonial.id, input.id))
    await cleanupRemovedCmsImages([current?.imageUrl ?? ""], [imageUrl])
    if (current) {
      await recordAudit(session, {
        action: "update",
        area: "testimonial",
        entityLabel: values.name,
        summary: `Cập nhật câu chuyện ${values.name}`,
        changes: testimonialAuditChanges(current, values),
      })
    }
    await revalidateAdmin(["/", "/reviews"])
    return actionOk({ slug })
  }

  await db.insert(testimonial).values({
    ...values,
    sortOrder: 99,
  })
  await recordAudit(session, {
    action: "create",
    area: "testimonial",
    entityLabel: values.name,
    summary: `Tạo câu chuyện ${values.name}`,
    changes: testimonialAuditChanges(null, values),
  })
  await revalidateAdmin(["/", "/reviews"])
  return actionOk({ slug })
}

export async function deleteTestimonialAction(id: string): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  const [row] = await db
    .select({ imageUrl: testimonial.imageUrl, name: testimonial.name })
    .from(testimonial)
    .where(eq(testimonial.id, id))
    .limit(1)
  await db.delete(testimonial).where(eq(testimonial.id, id))
  await recordAudit(session, {
    action: "delete",
    area: "testimonial",
    entityLabel: row?.name ?? "",
    summary: `Xóa câu chuyện ${row?.name ?? ""}`,
    changes: deletedChange(row?.name ?? ""),
  })
  await cleanupRemovedCmsImages([row?.imageUrl ?? ""], [])
  await revalidateAdmin(["/", "/reviews"])
  return actionOk()
}

export async function saveTestimonialsSectionAction(
  input: TestimonialsSectionCopy
): Promise<ActionResult> {
  const session = await requireUsableAdminSession()
  if (!input.labelVi.trim() || !input.titleVi.trim()) {
    return actionFail("Vui lòng nhập nhãn và tiêu đề tiếng Việt.")
  }

  const [current] = await db
    .select({ value: siteCopy.value })
    .from(siteCopy)
    .where(eq(siteCopy.key, "home.testimonials"))
    .limit(1)
  const previous = testimonialSectionValue(current?.value)
  const next = {
    label: toLocalized(input.labelVi, input.labelEn),
    title: toLocalized(input.titleVi, input.titleEn),
  }

  await db
    .insert(siteCopy)
    .values({
      key: "home.testimonials",
      value: next,
    })
    .onDuplicateKeyUpdate({
      set: { value: next },
    })
  await recordAudit(session, {
    action: "update",
    area: "testimonial",
    entityLabel: "Tiêu đề câu chuyện cô dâu",
    summary: "Cập nhật tiêu đề câu chuyện cô dâu",
    changes: diffFields([
      ...localizedChanges("Nhãn", previous.label, next.label),
      ...localizedChanges("Tiêu đề", previous.title, next.title),
    ]),
  })
  await revalidateAdmin(["/", "/reviews"])
  return actionOk()
}

function testimonialStatusLabel(status: string) {
  return status === "draft" ? TESTIMONIAL_STATUS_LABELS.draft : TESTIMONIAL_STATUS_LABELS.published
}

function testimonialAuditChanges(
  before: {
    name: string
    quote: { vi: string; en: string }
    imageUrl: string
    imageAlt: { vi: string; en: string }
    gown: string
    year: number | null
    status: string
  } | null,
  after: {
    name: string
    quote: { vi: string; en: string }
    imageUrl: string
    imageAlt: { vi: string; en: string }
    gown: string
    year: number | null
    status: string
  }
) {
  return diffFields([
    { label: "Tên", before: before?.name ?? "", after: after.name },
    ...localizedChanges("Lời nhận xét", before?.quote, after.quote),
    { label: "Ảnh", before: before?.imageUrl ?? "", after: after.imageUrl, images: true },
    ...localizedChanges("Mô tả ảnh", before?.imageAlt, after.imageAlt),
    { label: "Váy", before: before?.gown ?? "", after: after.gown },
    { label: "Năm", before: before?.year ?? "", after: after.year ?? "" },
    {
      label: "Trạng thái",
      before: before ? testimonialStatusLabel(before.status) : "",
      after: testimonialStatusLabel(after.status),
    },
  ])
}

function testimonialSectionValue(value: unknown) {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}
  const pair = (input: unknown) => {
    const data =
      input && typeof input === "object" && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : {}
    return {
      vi: typeof data.vi === "string" ? data.vi : "",
      en: typeof data.en === "string" ? data.en : "",
    }
  }
  return {
    label: pair(record.label),
    title: pair(record.title),
  }
}
