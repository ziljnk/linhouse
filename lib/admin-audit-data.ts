import { and, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm"
import { db } from "@/lib/db"
import { adminAuditLog } from "@/lib/db/schema"
import {
  formatAuditDate,
  isAuditAction,
  isAuditArea,
  type AuditAction,
  type AuditArea,
  type AuditChange,
} from "@/lib/admin-audit-shared"
import {
  likePattern,
  paginateMeta,
  type AdminPageResult,
} from "@/lib/admin-pagination"

export type AdminAuditLogItem = {
  id: string
  createdAt: string
  actorName: string
  actorEmail: string
  action: AuditAction
  area: AuditArea
  entityLabel: string
  summary: string
  changes: AuditChange[]
}

export async function listAdminAuditLogs(query: {
  q?: string
  page?: number
  area?: string
  action?: string
}): Promise<AdminPageResult<AdminAuditLogItem>> {
  const q = query.q?.trim() ?? ""
  const area = query.area && isAuditArea(query.area) ? query.area : ""
  const action = query.action && isAuditAction(query.action) ? query.action : ""
  const conditions: SQL[] = []

  if (area) conditions.push(eq(adminAuditLog.area, area))
  if (action) conditions.push(eq(adminAuditLog.action, action))
  if (q) {
    const pattern = likePattern(q)
    conditions.push(
      or(
        like(adminAuditLog.actorName, pattern),
        like(adminAuditLog.actorEmail, pattern),
        like(adminAuditLog.entityLabel, pattern),
        like(adminAuditLog.summary, pattern),
        sql`cast(${adminAuditLog.changes} as char) like ${pattern}`
      )!
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined
  const [countRow] = await db
    .select({ total: count() })
    .from(adminAuditLog)
    .where(where)
  const meta = paginateMeta(Number(countRow?.total ?? 0), query.page ?? 1)
  const rows = await db
    .select()
    .from(adminAuditLog)
    .where(where)
    .orderBy(desc(adminAuditLog.createdAt), desc(adminAuditLog.id))
    .limit(meta.pageSize)
    .offset(meta.offset)

  return {
    items: rows.map((row) => ({
      id: row.id,
      createdAt: formatAuditDate(row.createdAt),
      actorName: row.actorName,
      actorEmail: row.actorEmail,
      action: row.action,
      area: row.area,
      entityLabel: row.entityLabel,
      summary: row.summary,
      changes: row.changes,
    })),
    total: meta.total,
    page: meta.page,
    pageCount: meta.pageCount,
    pageSize: meta.pageSize,
  }
}
