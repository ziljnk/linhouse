import { db } from "@/lib/db"
import { adminAuditLog } from "@/lib/db/schema"
import type { AuditAction, AuditArea, AuditChange } from "@/lib/admin-audit-shared"

export type AuditEntry = {
  action: AuditAction
  area: AuditArea
  entityLabel: string
  summary: string
  changes: AuditChange[]
}

type AuditSession = {
  user: {
    id: string
    name?: string | null
    email?: string | null
  }
}

export async function recordAudit(
  session: AuditSession,
  entry: AuditEntry | (() => AuditEntry | Promise<AuditEntry>)
) {
  try {
    const resolved = typeof entry === "function" ? await entry() : entry
    if (!resolved.changes.length) return

    await db.insert(adminAuditLog).values({
      actorUserId: session.user.id,
      actorName: (session.user.name ?? "").slice(0, 255),
      actorEmail: (session.user.email ?? "").slice(0, 255),
      action: resolved.action,
      area: resolved.area,
      entityLabel: resolved.entityLabel.slice(0, 500),
      summary: resolved.summary.slice(0, 500),
      changes: resolved.changes,
    })
  } catch (error) {
    console.error("recordAudit failed", error)
  }
}
