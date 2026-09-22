import { firstSearchParam } from "@/lib/admin-pagination"

export const ANALYTICS_RANGES = ["today", "7d", "30d"] as const

export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]

export type AnalyticsRankItem = {
  key: string
  label: string
  description?: string
  hint?: string
  href?: string
  views: number
}

export type AnalyticsOverview = {
  range: AnalyticsRange
  totalViews: number
  productViews: number
  postViews: number
  products: AnalyticsRankItem[]
  posts: AnalyticsRankItem[]
  countries: AnalyticsRankItem[]
  referrers: AnalyticsRankItem[]
  devices: AnalyticsRankItem[]
}

export const ANALYTICS_RANGE_LABELS: Record<AnalyticsRange, string> = {
  today: "Hôm nay",
  "7d": "7 ngày",
  "30d": "30 ngày",
}

export const ANALYTICS_RANGE_PHRASES: Record<AnalyticsRange, string> = {
  today: "hôm nay",
  "7d": "7 ngày qua",
  "30d": "30 ngày qua",
}

export function parseAnalyticsRange(
  value: string | string[] | undefined
): AnalyticsRange {
  const next = firstSearchParam(value).trim()
  return ANALYTICS_RANGES.includes(next as AnalyticsRange)
    ? (next as AnalyticsRange)
    : "7d"
}

export function formatAnalyticsCount(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value)
}

export function formatAnalyticsShare(views: number, total: number) {
  if (total <= 0 || views <= 0) return "0%"
  const share = (views / total) * 100
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: share >= 10 ? 0 : 1,
  }).format(share) + "%"
}
