export const ADMIN_PAGE_SIZE = 20

export type AdminPageResult<T> = {
  items: T[]
  total: number
  page: number
  pageCount: number
  pageSize: number
}

export function firstSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

export function parseAdminPage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(firstSearchParam(value), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function parseAdminQuery(value: string | string[] | undefined) {
  return firstSearchParam(value).trim()
}

export function parseAdminFilter(value: string | string[] | undefined) {
  const next = firstSearchParam(value).trim()
  return next && next !== "all" ? next : ""
}

export function likePattern(query: string) {
  return `%${query.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`
}

export function paginateMeta(
  total: number,
  requestedPage: number,
  pageSize = ADMIN_PAGE_SIZE
) {
  const safeTotal = Math.max(0, total)
  const pageCount = Math.max(1, Math.ceil(safeTotal / pageSize))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  return {
    total: safeTotal,
    page,
    pageCount,
    pageSize,
    offset: (page - 1) * pageSize,
  }
}
