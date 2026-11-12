import {
  detectImageTypeFromBytes,
  readFileHeader,
  type AcceptedImageType,
} from "@/lib/image-file"

/** Admin card limit. The shared uploader still allows 10MB for other images. */
export const PROMOTION_IMAGE_MAX_BYTES = 5 * 1024 * 1024

export const PROMOTION_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type PromotionImageType = (typeof PROMOTION_IMAGE_TYPES)[number]

export const PROMOTION_IMAGE_TOO_LARGE_MESSAGE =
  "Ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn."

export const PROMOTION_IMAGE_TYPE_MESSAGE =
  "Chỉ nhận ảnh JPG, PNG hoặc WebP."

export const PROMOTION_LINK_MESSAGE =
  "Liên kết phải là đường dẫn https. Các dạng khác, kể cả javascript:, không được chấp nhận."

export const PROMOTION_DATE_MESSAGE = "Ngày không hợp lệ."

export const PROMOTION_DATE_ORDER_MESSAGE =
  "Ngày bắt đầu phải trước hoặc trùng ngày kết thúc."

const PROMOTION_IMAGE_TYPE_SET = new Set<string>(PROMOTION_IMAGE_TYPES)

/** Asia/Ho_Chi_Minh is UTC+7 year-round. Calendar dates are interpreted there. */
const VIETNAM_OFFSET_HOURS = 7

export type PromotionWindow = {
  enabled: boolean
  startsOn: string | null
  endsOn: string | null
}

export type PromotionPopupStatus = "live" | "scheduled" | "off"

export type PromotionImageValidation =
  | { ok: true; mime: PromotionImageType }
  | { ok: false; reason: "type" | "size" | "content" }

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function parsePromotionDate(
  value: unknown
): { ok: true; date: string | null } | { ok: false } {
  if (value == null || value === "") return { ok: true, date: null }
  if (typeof value !== "string") return { ok: false }
  const trimmed = value.trim()
  if (!trimmed) return { ok: true, date: null }
  if (!promotionStartInstant(trimmed)) return { ok: false }
  return { ok: true, date: trimmed }
}

/** Inclusive start of that calendar day in Asia/Ho_Chi_Minh, or null when the date is empty or invalid. */
export function promotionStartInstant(isoDate: string | null | undefined): Date | null {
  if (!isoDate) return null
  const match = ISO_DATE.exec(isoDate.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const probe = new Date(Date.UTC(year, month - 1, day))
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null
  }

  return new Date(Date.UTC(year, month - 1, day, -VIETNAM_OFFSET_HOURS, 0, 0, 0))
}

/** Inclusive end of that calendar day in Asia/Ho_Chi_Minh. */
export function promotionEndInstant(isoDate: string | null | undefined): Date | null {
  const start = promotionStartInstant(isoDate)
  if (!start) return null
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
}

export function promotionDateOrderError(
  startsOn: string | null,
  endsOn: string | null
): string | null {
  if (!startsOn || !endsOn) return null
  if (startsOn > endsOn) return PROMOTION_DATE_ORDER_MESSAGE
  return null
}

/**
 * No start means the window has already begun. No end means it never expires.
 * A disabled popup is off even inside the dates. An enabled popup before the
 * start date is scheduled. After the end date it is off.
 */
export function promotionPopupStatus(
  window: PromotionWindow,
  now: Date
): PromotionPopupStatus {
  if (!window.enabled) return "off"

  const end = promotionEndInstant(window.endsOn)
  if (end && now.getTime() > end.getTime()) return "off"

  const start = promotionStartInstant(window.startsOn)
  if (start && now.getTime() < start.getTime()) return "scheduled"

  return "live"
}

export function isPromotionPopupVisible(window: PromotionWindow, now: Date) {
  return promotionPopupStatus(window, now) === "live"
}

export function parsePromotionLink(
  value: unknown
): { ok: true; url: string | null } | { ok: false; error: string } {
  if (value == null) return { ok: true, url: null }
  if (typeof value !== "string") return { ok: false, error: PROMOTION_LINK_MESSAGE }

  const trimmed = value.trim()
  if (!trimmed) return { ok: true, url: null }
  if (trimmed.length > 2048) return { ok: false, error: PROMOTION_LINK_MESSAGE }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, error: PROMOTION_LINK_MESSAGE }
  }

  if (parsed.protocol !== "https:" || !parsed.hostname) {
    return { ok: false, error: PROMOTION_LINK_MESSAGE }
  }

  return { ok: true, url: trimmed }
}

export function sanitizePromotionFilename(name: string) {
  const base = name.split(/[/\\]/).pop() ?? ""
  const cleaned = base.replace(/[\u0000-\u001f]/g, "").trim()
  return cleaned.slice(0, 255)
}

export function validatePromotionImage(input: {
  size: number
  declaredType?: string
  header: Uint8Array
}): PromotionImageValidation {
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > PROMOTION_IMAGE_MAX_BYTES) {
    return { ok: false, reason: "size" }
  }

  const declared = input.declaredType?.trim().toLowerCase() ?? ""
  if (declared && !PROMOTION_IMAGE_TYPE_SET.has(declared)) {
    return { ok: false, reason: "type" }
  }

  const detected = detectImageTypeFromBytes(input.header)
  if (!detected || !isPromotionImageType(detected)) {
    return { ok: false, reason: "type" }
  }

  if (declared && declared !== detected) {
    return { ok: false, reason: "content" }
  }

  return { ok: true, mime: detected }
}

export async function validatePromotionImageFile(
  file: File
): Promise<PromotionImageValidation> {
  const header = await readFileHeader(file)
  return validatePromotionImage({
    size: file.size,
    declaredType: file.type,
    header,
  })
}

export function promotionImageErrorMessage(reason: "type" | "size" | "content") {
  if (reason === "size") return PROMOTION_IMAGE_TOO_LARGE_MESSAGE
  return PROMOTION_IMAGE_TYPE_MESSAGE
}

function isPromotionImageType(type: AcceptedImageType): type is PromotionImageType {
  return PROMOTION_IMAGE_TYPE_SET.has(type)
}
