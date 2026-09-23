"use server"

import { actionFail, actionOk, revalidateAdmin } from "@/lib/admin-actions"
import { requireUsableAdminSession } from "@/lib/admin-session"
import { writeSiteContent, type ContentPair } from "@/lib/site-content"

export async function saveSiteContentAction(values: Record<string, ContentPair>) {
  await requireUsableAdminSession()

  const result = await writeSiteContent(values)
  if (!result.ok) return actionFail(result.error)

  await revalidateAdmin()
  return actionOk()
}
