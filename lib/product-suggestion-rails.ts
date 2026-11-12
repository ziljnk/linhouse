import { PRODUCT_RAIL_COUNT } from "@/lib/catalog"
import { isProductId } from "@/lib/home-product-carousels"

export const SUGGESTION_RAILS = ["related", "recommended"] as const
export type SuggestionRail = (typeof SUGGESTION_RAILS)[number]

export const SUGGESTION_RAIL_LIMIT = PRODUCT_RAIL_COUNT
export const SUGGESTION_RAIL_MINIMUM = 5

export const SUGGESTION_RAIL_LABELS: Record<SuggestionRail, string> = {
  related: "Sản phẩm liên quan",
  recommended: "Sản phẩm bạn có thể thích",
}

export const SUGGESTION_RAIL_HINTS: Record<SuggestionRail, string> = {
  related:
    "Carousel đầu trên mọi trang sản phẩm. Nếu chọn thì cần ít nhất 5 sản phẩm và giữ đúng thứ tự. Để trống thì trang tự lấy ngẫu nhiên các sản phẩm cùng loại.",
  recommended:
    "Carousel thứ hai trên mọi trang sản phẩm. Nếu chọn thì cần ít nhất 5 sản phẩm và giữ đúng thứ tự. Để trống thì trang tự lấy ngẫu nhiên các sản phẩm còn lại.",
}

export const SUGGESTION_RAIL_LIMIT_ERROR = "Mỗi carousel tối đa 12 sản phẩm."
export const SUGGESTION_RAIL_MINIMUM_ERROR =
  "Mỗi carousel cần ít nhất 5 sản phẩm. Để trống nếu muốn lấy ngẫu nhiên."
export const SUGGESTION_RAIL_GENERIC_ERROR =
  "Không cập nhật được carousel. Vui lòng thử lại."
export const SUGGESTION_RAIL_CONFLICT_ERROR =
  "Carousel đã được sửa ở nơi khác. Vui lòng tải lại trang."
export const SUGGESTION_RAIL_LIMIT_HINT =
  "Đã đủ 12 sản phẩm. Bỏ bớt một sản phẩm để thêm mới."

export type SuggestionRailEditor = {
  rail: SuggestionRail
  version: string
  productIds: string[]
}

export type SuggestionRailEditorData = {
  rails: SuggestionRailEditor[]
}

export function isSuggestionRail(value: unknown): value is SuggestionRail {
  return value === "related" || value === "recommended"
}

export function suggestionRailVersion(ids: readonly string[]) {
  return JSON.stringify(ids)
}

export function parseSuggestionRailSave(input: {
  rail?: unknown
  ids?: unknown
  version?: unknown
}):
  | { ok: true; rail: SuggestionRail; ids: string[]; version: string }
  | { ok: false; error: string } {
  if (!isSuggestionRail(input?.rail)) {
    return { ok: false, error: SUGGESTION_RAIL_GENERIC_ERROR }
  }
  if (typeof input.version !== "string" || input.version.length > 8000) {
    return { ok: false, error: SUGGESTION_RAIL_GENERIC_ERROR }
  }
  if (!Array.isArray(input.ids)) {
    return { ok: false, error: SUGGESTION_RAIL_GENERIC_ERROR }
  }
  if (input.ids.length > SUGGESTION_RAIL_LIMIT) {
    return { ok: false, error: SUGGESTION_RAIL_LIMIT_ERROR }
  }
  if (input.ids.length > 0 && input.ids.length < SUGGESTION_RAIL_MINIMUM) {
    return { ok: false, error: SUGGESTION_RAIL_MINIMUM_ERROR }
  }

  const ids: string[] = []
  const seen = new Set<string>()
  for (const item of input.ids) {
    if (typeof item !== "string" || !isProductId(item) || seen.has(item)) {
      return { ok: false, error: SUGGESTION_RAIL_GENERIC_ERROR }
    }
    seen.add(item)
    ids.push(item)
  }

  return { ok: true, rail: input.rail, ids, version: input.version }
}
