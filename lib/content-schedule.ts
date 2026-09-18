import { and, eq, gt, lte, type Column, type SQL } from "drizzle-orm"
import { actionFail, type ActionResult } from "@/lib/admin-actions"
import type { ContentStatus, PublishIntent } from "@/lib/content-status"

export type { ContentStatus, PublishIntent }

export function resolvePublishFields(input: {
  intent: PublishIntent
  publishedAt?: string | null
  existingPublishedAt?: Date | null
}): ActionResult<{ status: ContentStatus; publishedAt: Date | null }> {
  if (input.intent === "draft") {
    return { ok: true, data: { status: "draft", publishedAt: null } }
  }

  if (input.intent === "schedule") {
    if (!input.publishedAt) return actionFail("Vui lòng chọn thời gian đăng.")
    const date = new Date(input.publishedAt)
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      return actionFail("Thời gian hẹn lịch phải ở tương lai.")
    }
    return { ok: true, data: { status: "published", publishedAt: date } }
  }

  const existing = input.existingPublishedAt
  const publishedAt =
    existing && existing.getTime() <= Date.now() ? existing : new Date()
  return { ok: true, data: { status: "published", publishedAt } }
}

export function isLiveContent(
  statusColumn: Column,
  publishedAtColumn: Column
): SQL {
  return and(eq(statusColumn, "published"), lte(publishedAtColumn, new Date()))!
}

export function adminListStatusCondition(
  statusColumn: Column,
  publishedAtColumn: Column,
  filter?: string
): SQL | undefined {
  if (filter === "draft") return eq(statusColumn, "draft")
  if (filter === "scheduled") {
    return and(eq(statusColumn, "published"), gt(publishedAtColumn, new Date()))
  }
  if (filter === "published") {
    return and(eq(statusColumn, "published"), lte(publishedAtColumn, new Date()))
  }
  return undefined
}
