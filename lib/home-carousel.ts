import type { ContentListFilter } from "@/lib/content-status"

export const HOME_CAROUSEL_LIMIT = 12

export const HOME_CAROUSEL_LIMIT_ERROR = "Carousel đã đủ 12 bộ sưu tập."
export const HOME_CAROUSEL_GENERIC_ERROR =
  "Không cập nhật được carousel. Vui lòng thử lại."
export const HOME_CAROUSEL_CONFLICT_ERROR =
  "Carousel đã được sửa ở nơi khác. Vui lòng tải lại trang."
export const HOME_CAROUSEL_LIMIT_HINT =
  "Đã đủ 12 bộ sưu tập. Bỏ bớt một bộ sưu tập để thêm mới."

const COLLECTION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type HomeCarouselEditorItem = {
  id: string
  name: string
  appearance: ContentListFilter
  publishedAt: string | null
  coverUrl: string
  showOnHome: boolean
  homeOrder: number | null
}

export type HomeCarouselEditorData = {
  version: string
  items: HomeCarouselEditorItem[]
}

export type HomeCarouselMembership = {
  showOnHome: boolean
  homeOrder: number | null
}

export function isCollectionId(value: string) {
  return COLLECTION_ID.test(value)
}

export function homeCarouselVersion(
  rows: { id: string; showOnHome: boolean; homeOrder: number | null }[]
) {
  return rows
    .filter((row) => row.showOnHome)
    .slice()
    .sort(compareHomeCarouselOrder)
    .map((row) => `${row.id}:${row.homeOrder ?? ""}`)
    .join("|")
}

export function compareHomeCarouselOrder(
  a: { id: string; homeOrder: number | null },
  b: { id: string; homeOrder: number | null }
) {
  const orderA = a.homeOrder ?? Number.MAX_SAFE_INTEGER
  const orderB = b.homeOrder ?? Number.MAX_SAFE_INTEGER
  if (orderA !== orderB) return orderA - orderB
  return a.id.localeCompare(b.id)
}

export function orderedHomeSelections(items: HomeCarouselEditorItem[]) {
  return items.filter((item) => item.showOnHome).slice().sort(compareHomeCarouselOrder)
}

export function isHomeCarouselVisible(item: {
  appearance: ContentListFilter
  coverUrl: string
}) {
  return item.appearance === "published" && item.coverUrl.trim().length > 0
}

export function formatHomeCarouselDay(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso))
}

export function nextHomeCarouselOrder(
  rows: { showOnHome: boolean; homeOrder: number | null }[]
) {
  let max = 0
  for (const row of rows) {
    if (!row.showOnHome || row.homeOrder == null) continue
    if (row.homeOrder > max) max = row.homeOrder
  }
  return max + 1
}

export function planHomeCarouselMembership(
  rows: HomeCarouselMembership[],
  current: HomeCarouselMembership | null,
  enabled: boolean
):
  | { ok: true; changed: boolean; showOnHome: boolean; homeOrder: number | null }
  | { ok: false; error: string } {
  if (!enabled) {
    if (current && !current.showOnHome) {
      return {
        ok: true,
        changed: false,
        showOnHome: false,
        homeOrder: current.homeOrder,
      }
    }
    return { ok: true, changed: Boolean(current?.showOnHome), showOnHome: false, homeOrder: null }
  }

  if (current?.showOnHome) {
    return {
      ok: true,
      changed: false,
      showOnHome: true,
      homeOrder: current.homeOrder,
    }
  }

  const selected = rows.filter((row) => row.showOnHome).length
  if (selected >= HOME_CAROUSEL_LIMIT) {
    return { ok: false, error: HOME_CAROUSEL_LIMIT_ERROR }
  }

  return {
    ok: true,
    changed: true,
    showOnHome: true,
    homeOrder: nextHomeCarouselOrder(rows),
  }
}

export function parseHomeCarouselIds(
  value: unknown
): { ok: true; ids: string[] } | { ok: false; error: string } {
  if (!Array.isArray(value)) {
    return { ok: false, error: HOME_CAROUSEL_GENERIC_ERROR }
  }
  if (value.length > HOME_CAROUSEL_LIMIT) {
    return { ok: false, error: HOME_CAROUSEL_LIMIT_ERROR }
  }

  const ids: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== "string" || !isCollectionId(item) || seen.has(item)) {
      return { ok: false, error: HOME_CAROUSEL_GENERIC_ERROR }
    }
    seen.add(item)
    ids.push(item)
  }
  return { ok: true, ids }
}

export function parseHomeCarouselVersion(value: unknown) {
  if (typeof value !== "string" || value.length > 2000) return null
  return value
}
