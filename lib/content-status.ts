export type PublishIntent = "draft" | "publish" | "schedule"

export type ContentStatus = "draft" | "published"

export const CONTENT_LIST_FILTERS = ["published", "scheduled", "draft"] as const

export type ContentListFilter = (typeof CONTENT_LIST_FILTERS)[number]

export const CONTENT_LIST_FILTER_LABELS: Record<ContentListFilter, string> = {
  published: "Đã đăng",
  scheduled: "Đã lên lịch",
  draft: "Draft",
}

export function isFutureDate(value: Date | string | null | undefined) {
  if (!value) return false
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Number.isFinite(time) && time > Date.now()
}

export function toContentStatus(status: string): ContentStatus {
  return status === "draft" ? "draft" : "published"
}

export function contentAppearance(
  status: string,
  publishedAt: Date | string | null | undefined
): ContentListFilter {
  if (status === "draft") return "draft"
  if (status === "scheduled" || isFutureDate(publishedAt)) return "scheduled"
  return "published"
}

export function formatPublishedAt(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso))
}

export function isLivePublished(
  status: string | null | undefined,
  publishedAt: Date | string | null | undefined
) {
  return toContentStatus(status ?? "draft") === "published" && !isFutureDate(publishedAt) && Boolean(publishedAt)
}
