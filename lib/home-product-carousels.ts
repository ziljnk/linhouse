import type { ContentListFilter } from "@/lib/content-status"

export const HOME_PRODUCT_CAROUSEL_SLOTS = [1, 2] as const
export type HomeProductCarouselSlot = (typeof HOME_PRODUCT_CAROUSEL_SLOTS)[number]

export const HOME_PRODUCT_CAROUSEL_LIMIT = 16
export const HOME_PRODUCT_CAROUSEL_TITLE_MAX = 120

export const HOME_PRODUCT_CAROUSEL_LABELS: Record<HomeProductCarouselSlot, string> = {
  1: "Carousel sản phẩm 1",
  2: "Carousel sản phẩm 2",
}

export const HOME_PRODUCT_CAROUSEL_LIMIT_ERROR = "Mỗi carousel tối đa 16 sản phẩm."
export const HOME_PRODUCT_CAROUSEL_GENERIC_ERROR =
  "Không cập nhật được carousel. Vui lòng thử lại."
export const HOME_PRODUCT_CAROUSEL_CONFLICT_ERROR =
  "Carousel đã được sửa ở nơi khác. Vui lòng tải lại trang."
export const HOME_PRODUCT_CAROUSEL_TITLE_ERROR = "Tiêu đề tối đa 120 ký tự."
export const HOME_PRODUCT_CAROUSEL_LIMIT_HINT =
  "Đã đủ 16 sản phẩm. Bỏ bớt một sản phẩm để thêm mới."

const PRODUCT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type HomeProductCarouselProduct = {
  id: string
  name: string
  code: string
  appearance: ContentListFilter
  publishedAt: string | null
  imageUrl: string
}

export type HomeProductCarouselEditor = {
  slot: HomeProductCarouselSlot
  version: string
  titleVi: string
  titleEn: string
  productIds: string[]
}

export type HomeProductCarouselEditorData = {
  products: HomeProductCarouselProduct[]
  carousels: HomeProductCarouselEditor[]
}

export function isHomeProductCarouselSlot(
  value: unknown
): value is HomeProductCarouselSlot {
  return value === 1 || value === 2
}

export function homeProductCarouselTitleKey(slot: HomeProductCarouselSlot) {
  return `home.productCarousel.${slot}.title`
}

export function homeProductCarouselLabel(slot: HomeProductCarouselSlot) {
  return HOME_PRODUCT_CAROUSEL_LABELS[slot]
}

export type HomeProductCarouselEditorProduct = HomeProductCarouselProduct
export type HomeProductCarouselSlotEditor = HomeProductCarouselEditor

export function formatHomeProductCarouselDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso))
}

export function isProductId(value: string) {
  return PRODUCT_ID.test(value)
}

export function readHomeProductCarouselTitle(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { vi: "", en: "" }
  }
  const record = value as Record<string, unknown>
  const text = (item: unknown) => (typeof item === "string" ? item.trim() : "")
  return { vi: text(record.vi), en: text(record.en) }
}

export function homeProductCarouselVersion(input: {
  titleVi: string
  titleEn: string
  ids: readonly string[]
}) {
  return JSON.stringify({
    vi: input.titleVi,
    en: input.titleEn,
    ids: [...input.ids],
  })
}

export function isHomeProductCarouselVisible(item: {
  appearance: ContentListFilter
  imageUrl: string
}) {
  return item.appearance === "published" && item.imageUrl.trim().length > 0
}

function parseTitle(value: unknown, label: string) {
  if (typeof value !== "string") {
    return { ok: false as const, error: HOME_PRODUCT_CAROUSEL_GENERIC_ERROR }
  }
  const text = value.trim()
  if (text.length > HOME_PRODUCT_CAROUSEL_TITLE_MAX) {
    return {
      ok: false as const,
      error: `${label} tối đa ${HOME_PRODUCT_CAROUSEL_TITLE_MAX} ký tự.`,
    }
  }
  return { ok: true as const, text }
}

export function parseHomeProductCarouselSave(input: {
  slot?: unknown
  titleVi?: unknown
  titleEn?: unknown
  ids?: unknown
  version?: unknown
}):
  | {
      ok: true
      slot: HomeProductCarouselSlot
      titleVi: string
      titleEn: string
      ids: string[]
      version: string
    }
  | { ok: false; error: string } {
  if (!isHomeProductCarouselSlot(input?.slot)) {
    return { ok: false, error: HOME_PRODUCT_CAROUSEL_GENERIC_ERROR }
  }
  if (typeof input.version !== "string" || input.version.length > 8000) {
    return { ok: false, error: HOME_PRODUCT_CAROUSEL_GENERIC_ERROR }
  }
  const titleVi = parseTitle(input.titleVi, "Tiêu đề tiếng Việt")
  if (!titleVi.ok) return titleVi
  const titleEn = parseTitle(input.titleEn, "Tiêu đề tiếng Anh")
  if (!titleEn.ok) return titleEn
  if (!Array.isArray(input.ids)) {
    return { ok: false, error: HOME_PRODUCT_CAROUSEL_GENERIC_ERROR }
  }
  if (input.ids.length > HOME_PRODUCT_CAROUSEL_LIMIT) {
    return { ok: false, error: HOME_PRODUCT_CAROUSEL_LIMIT_ERROR }
  }

  const ids: string[] = []
  const seen = new Set<string>()
  for (const item of input.ids) {
    if (typeof item !== "string" || !isProductId(item) || seen.has(item)) {
      return { ok: false, error: HOME_PRODUCT_CAROUSEL_GENERIC_ERROR }
    }
    seen.add(item)
    ids.push(item)
  }

  return {
    ok: true,
    slot: input.slot,
    titleVi: titleVi.text,
    titleEn: titleEn.text,
    ids,
    version: input.version,
  }
}
