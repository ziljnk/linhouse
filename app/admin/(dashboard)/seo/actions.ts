"use server"

import { actionFail, actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { recordAudit } from "@/lib/admin-audit"
import { requireUsableAdminSession } from "@/lib/admin-session"
import {
  staticSeoPaths,
  writeStaticPageSeo,
  type PageSeoFields,
} from "@/lib/page-seo"

export async function saveStaticPageSeoAction(values: Record<string, PageSeoFields>) {
  const session = await requireUsableAdminSession()

  const result = await writeStaticPageSeo(values)
  if (!result.ok) return actionFail(result.error)

  await recordAudit(session, {
    action: "update",
    area: "seo",
    entityLabel: "SEO trang tĩnh",
    summary: "Cập nhật SEO",
    changes: result.changes,
  })

  await revalidateAdmin(staticSeoPaths())
  return actionOk()
}
