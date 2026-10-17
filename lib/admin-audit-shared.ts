import { cmsImageDisplaySrc, parseCmsStorageKey } from "@/lib/cms-image"
import {
  CONTENT_LIST_FILTER_LABELS,
  contentAppearance,
} from "@/lib/content-status"

export const AUDIT_ACTIONS = ["create", "update", "delete"] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export const AUDIT_AREAS = [
  "content",
  "product",
  "collection",
  "catalog",
  "blog",
  "testimonial",
  "seo",
  "settings",
  "notifications",
] as const
export type AuditArea = (typeof AUDIT_AREAS)[number]

export type AuditChange = {
  label: string
  before: string
  after: string
  images?: boolean
}

export type AuditField = {
  label: string
  before: unknown
  after: unknown
  images?: boolean
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "Tạo",
  update: "Cập nhật",
  delete: "Xóa",
}

export const AUDIT_AREA_LABELS: Record<AuditArea, string> = {
  content: "Nội dung",
  product: "Sản phẩm",
  collection: "Bộ sưu tập",
  catalog: "Danh mục",
  blog: "Blog",
  testimonial: "Câu chuyện cô dâu",
  seo: "SEO",
  settings: "Cài đặt",
  notifications: "Thông báo",
}

const PREVIEW_LIMIT = 280
const IMAGE_FILE_EXT = /\.(avif|gif|jpe?g|png|webp|svg)(\?[^#]*)?$/i

export function isAuditAction(value: string): value is AuditAction {
  return AUDIT_ACTIONS.some((item) => item === value)
}

export function isAuditArea(value: string): value is AuditArea {
  return AUDIT_AREAS.some((item) => item === value)
}

export function auditImageSources(value: string): string[] | null {
  const parts = splitAuditList(value)
  if (!parts.length || parts.some((part) => !isAuditImageToken(part))) return null
  return parts.map((part) => cmsImageDisplaySrc(part))
}

export function auditChangeImageSources(value: string, images = false): string[] | null {
  const text = value.trim()
  if (!text) return null
  if (!images) return auditImageSources(text)
  const parts = splitAuditList(text)
  return parts.length ? parts.map((part) => cmsImageDisplaySrc(part)) : null
}

export function previewValue(value: unknown): string {
  const text = comparableValue(value)
  if (auditImageSources(text) || text.length <= PREVIEW_LIMIT) return text
  return `${text.slice(0, PREVIEW_LIMIT)}…`
}

export function diffFields(fields: AuditField[]): AuditChange[] {
  const changes: AuditChange[] = []
  for (const field of fields) {
    const before = comparableValue(field.before)
    const after = comparableValue(field.after)
    if (before === after) continue
    const images = field.images === true
    changes.push({
      label: field.label,
      before: images ? before : previewValue(before),
      after: images ? after : previewValue(after),
      ...(images ? { images: true } : {}),
    })
  }
  return changes
}

export function localizedChanges(
  label: string,
  before: { vi?: string | null; en?: string | null } | null | undefined,
  after: { vi?: string | null; en?: string | null } | null | undefined
): AuditField[] {
  const beforeVi = before?.vi ?? ""
  const beforeEn = before?.en ?? ""
  const afterVi = after?.vi ?? ""
  const afterEn = after?.en ?? ""
  if (beforeVi.trim() === beforeEn.trim() && afterVi.trim() === afterEn.trim()) {
    return [{ label, before: beforeVi, after: afterVi }]
  }
  return [
    { label: `${label} (VI)`, before: beforeVi, after: afterVi },
    { label: `${label} (EN)`, before: beforeEn, after: afterEn },
  ]
}

export function deletedChange(name: string): AuditChange[] {
  const label = name.trim()
  if (!label) return []
  return [{ label: "Đã xóa", before: label, after: "" }]
}

export function auditStatusLabel(
  status: string,
  publishedAt: Date | string | null | undefined
) {
  return CONTENT_LIST_FILTER_LABELS[contentAppearance(status, publishedAt)]
}

export function formatAuditDate(value: Date | string | null | undefined) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date)
}

export function joinAuditList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join(", ")
}

function splitAuditList(value: string) {
  return value
    .split(", ")
    .map((part) => part.trim())
    .filter(Boolean)
}

function isAuditImageToken(value: string) {
  if (parseCmsStorageKey(value)) return true
  if (value.startsWith("/uploads/")) return true
  if (value.startsWith("/") && !value.startsWith("//") && IMAGE_FILE_EXT.test(value)) {
    return true
  }
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return false
    return url.pathname.startsWith("/uploads/") || IMAGE_FILE_EXT.test(url.pathname)
  } catch {
    return false
  }
}

function comparableValue(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value.trim()
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString()
  }
  if (Array.isArray(value)) {
    return value.map((item) => comparableValue(item)).filter(Boolean).join(", ")
  }
  return JSON.stringify(value)
}
