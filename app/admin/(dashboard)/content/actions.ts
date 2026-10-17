"use server"

import { actionFail, actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { recordAudit } from "@/lib/admin-audit"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { writeSiteContent, type ContentPair } from "@/lib/site-content"

export async function saveSiteContentAction(values: Record<string, ContentPair>) {
  const session = await requireUsableAdminSession()

  const result = await writeSiteContent(values)
  if (!result.ok) return actionFail(result.error)

  await recordAudit(session, {
    action: "update",
    area: "content",
    entityLabel: "Nội dung trang",
    summary: "Cập nhật nội dung trang",
    changes: result.changes,
  })

  await revalidateAdmin([
    "/",
    "/about",
    "/blog",
    "/shipping",
    "/terms",
    "/privacy",
    "/support",
  ])
  return actionOk()
}
